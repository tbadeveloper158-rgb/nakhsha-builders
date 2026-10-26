#!/usr/bin/env python3
"""Static development server plus a session-preserving Nakhsha consultation bridge.

The browser never receives Nakhsha's PHP cookies, human token, or OTP flow token.
Real outbound POSTs occur only after an explicit same-origin user action. The
bridge preserves the official WhatsApp OTP and human-confirmation checks; it
never fabricates a verification state or a successful delivery receipt.
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass, field
from http import cookies
from http.cookiejar import CookieJar
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import secrets
import threading
import time
from urllib import error, parse, request

ROOT = Path(__file__).resolve().parent
OFFICIAL_ORIGIN = "https://nakhsha.in"
COOKIE_NAME = "nakhsha_consultation"
SESSION_TTL = 30 * 60
MAX_BODY = 24 * 1024
MAX_RESPONSE = 2 * 1024 * 1024
LOCATIONS = {"Mysuru", "Mandya", "Channarayapatna", "Chamarajanagar"}
PROJECT_TYPES = {"Residential Construction", "Commercial Construction", "Interiors", "Others"}
BUDGETS = {"45 to 65 Lacs", "65 Lacs to 85 Lacs", "85 Lacs & Above"}


class ContactError(Exception):
    def __init__(self, message, status=400, code="invalid_request", **extra):
        super().__init__(message)
        self.message, self.status, self.code, self.extra = message, status, code, extra


class ConsultationParser(HTMLParser):
    """Read only the first official consultation form, not unrelated career forms."""
    def __init__(self):
        super().__init__()
        self.active = False
        self.complete = False
        self.fields = {}
        self.flow_token = ""
        self.scope = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "form" and not self.complete and "data-consultation-form" in attrs:
            self.active = True
        if not self.active:
            return
        if tag == "input" and attrs.get("type") == "hidden":
            self.fields[attrs.get("name", "")] = attrs.get("value", "")
        if "data-msg91-otp" in attrs:
            self.flow_token = attrs.get("data-msg91-flow-token", "")
            self.scope = attrs.get("data-msg91-scope", "")

    def handle_endtag(self, tag):
        if tag == "form" and self.active:
            self.active = False
            self.complete = True


class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def normalise_phone(value):
    digits = re.sub(r"\D", "", str(value or ""))
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if not re.fullmatch(r"[6-9]\d{9}", digits):
        raise ContactError("Enter a valid 10-digit Indian mobile number.", code="invalid_mobile")
    return digits


def clean_text(data, name, maximum, required=True):
    value = str(data.get(name, "")).strip()
    if (required and not value) or len(value) > maximum or "\x00" in value or (name != "message" and ("\r" in value or "\n" in value)):
        raise ContactError("Please check the " + name.replace("_", " ") + " field.")
    return value


def validate_enquiry(data):
    if data.get("consent") is not True:
        raise ContactError("Please agree to be contacted about this enquiry.", code="consent_required")
    if data.get("human_confirm") is not True:
        raise ContactError("Please confirm that you are not a robot.", code="human_required")
    if str(data.get("website", "")).strip():
        raise ContactError("Unable to accept this enquiry.")
    result = {"name": clean_text(data, "name", 120), "mobile": normalise_phone(data.get("mobile")),
              "email": clean_text(data, "email", 160), "location": clean_text(data, "location", 80),
              "project_type": clean_text(data, "project_type", 80), "budget": clean_text(data, "budget", 80),
              "message": clean_text(data, "message", 1500, False)}
    if len(result["name"]) < 2:
        raise ContactError("Please enter your full name.")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", result["email"]):
        raise ContactError("Please enter a valid email address.")
    for key, allowed in (("location", LOCATIONS), ("project_type", PROJECT_TYPES), ("budget", BUDGETS)):
        if result[key] not in allowed:
            raise ContactError("Please select a valid " + key.replace("_", " ") + ".")
    return result


@dataclass(repr=False)
class RemoteSession:
    created: float = field(default_factory=time.monotonic)
    touched: float = field(default_factory=time.monotonic)
    jar: CookieJar = field(default_factory=CookieJar)
    flow_token: str = ""
    human_token: str = ""
    scope: str = "consultation"
    verified_phone: str = ""
    last_send: float = 0
    sends: int = 0
    verify_attempts: int = 0
    submitted: bool = False
    delivery_unknown: bool = False
    lock: threading.Lock = field(default_factory=threading.Lock)

    def __post_init__(self):
        self.opener = request.build_opener(request.HTTPCookieProcessor(self.jar), NoRedirect())


class ConsultationBridge:
    """All sessions and upstream credentials are ephemeral and private to this process."""
    def __init__(self):
        self.sessions = {}
        self.lock = threading.Lock()

    def create_or_get(self, session_id=None):
        now = time.monotonic()
        with self.lock:
            expired = [key for key, value in self.sessions.items() if now - value.touched > SESSION_TTL]
            for key in expired:
                del self.sessions[key]
            if session_id in self.sessions:
                session = self.sessions[session_id]
                session.touched = now
                return session_id, session
            if len(self.sessions) >= 256:
                raise ContactError("The consultation service is busy. Please try again shortly.", 503, "busy")
            key, session = secrets.token_urlsafe(32), RemoteSession()
            self.sessions[key] = session
            return key, session

    def existing(self, session_id):
        with self.lock:
            session = self.sessions.get(session_id)
            if not session or time.monotonic() - session.touched > SESSION_TTL:
                raise ContactError("Your verification session expired. Refresh the form and try again.", 409, "session_expired")
            session.touched = time.monotonic()
            return session

    def upstream(self, session, path, fields=None):
        url = OFFICIAL_ORIGIN + path
        body = parse.urlencode(fields).encode() if fields is not None else None
        headers = {"Accept": "application/json" if path.endswith("otp-api") else "text/html,application/json",
                   "User-Agent": "NakhshaConsultationBridge/1.0", "Referer": OFFICIAL_ORIGIN + "/contact"}
        if body is not None:
            headers.update({"Content-Type": "application/x-www-form-urlencoded", "Origin": OFFICIAL_ORIGIN})
            if path.endswith("otp-api"):
                headers["X-Requested-With"] = "XMLHttpRequest"
        req = request.Request(url, data=body, headers=headers)
        try:
            response = session.opener.open(req, timeout=25)
        except error.HTTPError as exc:
            # Native mail.php confirms delivery through a redirect; inspect it without
            # following the redirect or changing the submitted POST into a GET.
            if 300 <= exc.code < 400:
                return exc.code, dict(exc.headers), b""
            payload = exc.read(MAX_RESPONSE + 1)
            return exc.code, dict(exc.headers), payload[:MAX_RESPONSE]
        except (error.URLError, TimeoutError, OSError) as exc:
            raise ContactError("The official consultation service could not be reached. Please try later or call Nakhsha.",
                               502, "upstream_unavailable") from exc
        with response:
            payload = response.read(MAX_RESPONSE + 1)
            if len(payload) > MAX_RESPONSE:
                raise ContactError("The official consultation service returned an unexpected response.", 502, "upstream_response")
            return response.status, dict(response.headers), payload

    def bootstrap(self, session):
        with session.lock:
            if not session.flow_token or not session.human_token:
                status, _, payload = self.upstream(session, "/contact")
                parser = ConsultationParser()
                parser.feed(payload.decode("utf-8", errors="replace"))
                if status != 200 or not parser.flow_token or not parser.fields.get("human_token") or parser.scope != "consultation":
                    raise ContactError("Online verification is temporarily unavailable. You can use the official contact page or prepare an email enquiry.",
                                       502, "bootstrap_unavailable")
                session.flow_token = parser.flow_token
                session.human_token = parser.fields["human_token"]
                session.scope = parser.scope
        # No remote tokens, PHP cookies, secret values or session identifiers in JSON.
        return {"ok": True, "mode": "verified", "expires_in": SESSION_TTL,
                "message": "Verify your mobile number on WhatsApp before requesting a consultation."}

    def otp(self, session, data, verify=False):
        with session.lock:
            if not session.flow_token:
                raise ContactError("Prepare the verification form before continuing.", 409, "session_expired")
            if data.get("consent") is not True:
                raise ContactError("Please agree to be contacted before requesting a verification code.", code="consent_required")
            phone = normalise_phone(data.get("mobile"))
            if session.submitted or session.delivery_unknown:
                raise ContactError("This enquiry has already been processed. Please contact the team for further help.", 409, "already_processed")
            now = time.monotonic()
            if verify:
                code = str(data.get("otp", "")).strip()
                if not re.fullmatch(r"\d{4,6}", code):
                    raise ContactError("Enter the verification code received on WhatsApp.", code="invalid_otp")
                if session.verify_attempts >= 8:
                    raise ContactError("Too many verification attempts. Please request a fresh code.", 429, "verify_limit")
                session.verify_attempts += 1
            else:
                wait = max(0, int(30 - (now - session.last_send)) + 1) if session.last_send else 0
                if wait:
                    raise ContactError("Please wait before requesting another code.", 429, "rate_limited", retry_after=wait)
                if session.sends >= 5:
                    raise ContactError("The verification request limit has been reached. Please use the official contact page.", 429, "send_limit")
                session.last_send = now
                session.sends += 1
                session.verified_phone = ""
                session.verify_attempts = 0
            fields = {"action": "verify" if verify else "send", "scope": session.scope,
                      "phone": phone, "flow_token": session.flow_token}
            if verify:
                fields["otp"] = code
            status, _, payload = self.upstream(session, "/msg91-otp-api", fields)
            try:
                result = json.loads(payload)
            except (ValueError, UnicodeDecodeError):
                raise ContactError("The official verification service returned an unexpected response. Please try the official contact page.",
                                   502, "upstream_response")
            if not isinstance(result, dict) or result.get("ok") is not True:
                message = str(result.get("message", "Unable to verify your mobile number."))[:300] if isinstance(result, dict) else "Unable to verify your mobile number."
                retry = result.get("retry_after") if isinstance(result, dict) else None
                extra = {"retry_after": min(600, max(1, int(retry)))} if isinstance(retry, (int, float)) else {}
                raise ContactError(message, 400 if status < 500 else 502, "verification_failed", **extra)
            if verify:
                session.verified_phone = phone
            return {"ok": True, "verified": bool(verify),
                    "message": "Mobile number verified." if verify else "Verification code sent on WhatsApp.",
                    "retry_after": 0 if verify else max(30, min(600, int(result.get("retry_after", 30))))}

    def submit(self, session, data):
        fields = validate_enquiry(data)
        with session.lock:
            if session.submitted:
                raise ContactError("Your enquiry has already been accepted. Please avoid submitting it again.", 409, "already_submitted")
            if session.delivery_unknown:
                raise ContactError("Delivery could not be confirmed. Contact Nakhsha before submitting again.", 409, "delivery_unknown")
            if session.verified_phone != fields["mobile"]:
                raise ContactError("Verify this mobile number with the WhatsApp code before submitting.", 400, "otp_required")
            fields.update({"source": "Nakhsha Builders — commercial website consultation", "return_to": "contact",
                           "website": "", "human_token": session.human_token, "human_confirm": "1", "msg91_otp_verified": "1"})
            try:
                status, headers, _ = self.upstream(session, "/mail", fields)
            except ContactError:
                # A network failure after a POST might occur after the server received it.
                # Never automatically retry or claim it was delivered.
                session.delivery_unknown = True
                raise ContactError("We could not confirm delivery. Please contact Nakhsha before submitting again.", 504, "delivery_unknown")
            location = headers.get("Location", headers.get("location", ""))
            target = parse.urlsplit(parse.urljoin(OFFICIAL_ORIGIN, location))
            query = parse.parse_qs(target.query)
            trusted = target.scheme == "https" and target.netloc == "nakhsha.in"
            if status in (301, 302, 303, 307, 308) and trusted and query.get("consultation") == ["success"]:
                session.submitted = True
                return {"ok": True, "delivered": True, "message": "Your consultation request was accepted by Nakhsha. The team will contact you."}
            if trusted and query.get("consultation") == ["error"]:
                raise ContactError("The official form did not accept this enquiry. Please review your details or use the official contact page.",
                                   422, "submission_rejected")
            session.delivery_unknown = True
            raise ContactError("The official service did not provide a delivery confirmation. Please contact Nakhsha before trying again.",
                               502, "delivery_unknown")


class NakhshaHandler(SimpleHTTPRequestHandler):
    bridge = ConsultationBridge()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()

    def session_id(self):
        jar = cookies.SimpleCookie()
        try:
            jar.load(self.headers.get("Cookie", ""))
        except cookies.CookieError:
            return None
        item = jar.get(COOKIE_NAME)
        return item.value if item else None

    def json_response(self, status, data, session_id=None):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store, private")
        if session_id:
            secure = "; Secure" if os.environ.get("NAKHSHA_SECURE_COOKIE") == "1" or self.headers.get("X-Forwarded-Proto", "").split(",")[0].strip() == "https" else ""
            self.send_header("Set-Cookie", COOKIE_NAME + "=" + session_id + "; Path=/api/consultation; HttpOnly; SameSite=Strict; Max-Age=1800" + secure)
        self.end_headers()
        self.wfile.write(payload)

    def api_error(self, exc):
        self.json_response(exc.status, {"ok": False, "code": exc.code, "message": exc.message, **exc.extra})

    def same_origin(self):
        origin = parse.urlsplit(self.headers.get("Origin", ""))
        host = self.headers.get("Host", "").lower()
        if origin.scheme not in ("http", "https") or origin.netloc.lower() != host:
            raise ContactError("Please submit this form from the website where you opened it.", 403, "origin_rejected")

    def read_json(self):
        if self.headers.get_content_type() != "application/json":
            raise ContactError("Expected a JSON request.", 415)
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ContactError("Invalid request length.")
        if length <= 0 or length > MAX_BODY:
            raise ContactError("The request is too large.", 413)
        try:
            value = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeDecodeError):
            raise ContactError("Invalid request data.")
        if not isinstance(value, dict):
            raise ContactError("Invalid request data.")
        return value

    def do_GET(self):
        path = parse.urlsplit(self.path).path
        if path == "/api/consultation/bootstrap":
            try:
                # A cross-site browser fetch must not create a remote verification session.
                origin = self.headers.get("Origin")
                if origin:
                    self.same_origin()
                if self.headers.get("Sec-Fetch-Site") == "cross-site":
                    raise ContactError("Open the consultation form on this website.", 403, "origin_rejected")
                session_id, session = self.bridge.create_or_get(self.session_id())
                result = self.bridge.bootstrap(session)
                self.json_response(200, result, session_id)
            except ContactError as exc:
                self.api_error(exc)
            return
        if path.startswith("/api/"):
            self.json_response(404, {"ok": False, "message": "API route not found."})
            return
        decoded = parse.unquote(path)
        if any(part.startswith(".") for part in Path(decoded).parts if part not in ("/", "")):
            self.send_error(404)
            return
        resolved = Path(self.translate_path(path)).resolve()
        if not resolved.is_relative_to(ROOT):
            self.send_error(404)
            return
        super().do_GET()

    def do_POST(self):
        path = parse.urlsplit(self.path).path
        routes = {"/api/consultation/otp/send", "/api/consultation/otp/verify", "/api/consultation/submit"}
        if path not in routes:
            self.json_response(404, {"ok": False, "message": "API route not found."})
            return
        try:
            self.same_origin()
            data = self.read_json()
            session = self.bridge.existing(self.session_id())
            if path.endswith("/send"):
                result = self.bridge.otp(session, data)
            elif path.endswith("/verify"):
                result = self.bridge.otp(session, data, verify=True)
            else:
                result = self.bridge.submit(session, data)
            self.json_response(200, result)
        except ContactError as exc:
            self.api_error(exc)

    def log_message(self, fmt, *args):
        # Standard access logging includes routes/status only. Request bodies, remote
        # cookies, verification codes, tokens, and submitted enquiry fields are not logged.
        super().log_message(fmt, *args)


def main():
    parser = argparse.ArgumentParser(description="Serve Nakhsha Builders with the official consultation bridge.")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "3000")))
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), NakhshaHandler)
    print("Nakhsha Builders server listening on port", args.port)
    print("Official OTP and enquiry POSTs occur only after explicit form actions.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
