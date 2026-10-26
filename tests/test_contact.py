"""Mocked consultation-bridge tests. Never sends requests to production."""
import importlib.util
import json
from pathlib import Path
import sys
import threading
import unittest
from urllib import error, request

MODULE = Path(__file__).resolve().parents[1] / "server.py"
spec = importlib.util.spec_from_file_location("nakhsha_server", MODULE)
server_module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = server_module
spec.loader.exec_module(server_module)

FORM = b'''<form action="mail.php" data-consultation-form>
<input type="hidden" name="human_token" value="test-human-token">
<div data-msg91-otp data-msg91-scope="consultation" data-msg91-flow-token="test-flow-token"></div>
</form>'''
ENQUIRY = {"name": "Sample Client", "mobile": "9876543210", "email": "client@example.com",
           "location": "Mysuru", "project_type": "Commercial Construction", "budget": "85 Lacs & Above",
           "message": "A sample commercial project brief.", "consent": True, "human_confirm": True}


class FakeBridge(server_module.ConsultationBridge):
    def __init__(self):
        super().__init__()
        self.calls = []
        self.mail_location = "https://nakhsha.in/contact?consultation=success"
        self.fail_mail = False

    def upstream(self, session, path, fields=None):
        self.calls.append((session, path, fields.copy() if fields else None))
        if path == "/contact":
            return 200, {}, FORM
        if path == "/msg91-otp-api":
            if fields.get("action") == "verify" and fields.get("otp") != "123456":
                return 400, {}, b'{"ok":false,"message":"Incorrect code."}'
            return 200, {}, b'{"ok":true,"retry_after":30}'
        if path == "/mail":
            if self.fail_mail:
                raise server_module.ContactError("Timeout", 502, "upstream_unavailable")
            return 302, {"Location": self.mail_location}, b""
        raise AssertionError("Unexpected upstream route: " + path)


class BridgeTests(unittest.TestCase):
    def setUp(self):
        self.bridge = FakeBridge()
        handler = type("TestHandler", (server_module.NakhshaHandler,), {"bridge": self.bridge,
                       "log_message": lambda *args: None})
        self.server = server_module.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.origin = "http://127.0.0.1:" + str(self.server.server_port)
        self.cookie = None

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def api(self, path, data=None, origin=True, cookie=True):
        headers = {"Accept": "application/json"}
        if origin:
            headers["Origin"] = self.origin if origin is True else origin
        if cookie and self.cookie:
            headers["Cookie"] = self.cookie
        payload = None
        if data is not None:
            headers["Content-Type"] = "application/json"
            payload = json.dumps(data).encode()
        req = request.Request(self.origin + "/api/consultation" + path, payload, headers)
        try:
            response = request.urlopen(req)
        except error.HTTPError as exc:
            response = exc
        with response:
            if response.headers.get("Set-Cookie"):
                self.cookie = response.headers["Set-Cookie"].split(";", 1)[0]
            return response.status, json.load(response)

    def verified(self):
        self.api("/bootstrap")
        status, _ = self.api("/otp/send", {"mobile": ENQUIRY["mobile"], "consent": True})
        self.assertEqual(status, 200)
        status, body = self.api("/otp/verify", {"mobile": ENQUIRY["mobile"], "otp": "123456", "consent": True})
        self.assertEqual(status, 200)
        self.assertTrue(body["verified"])

    def test_bootstrap_is_read_only_and_keeps_remote_tokens_private(self):
        status, body = self.api("/bootstrap")
        self.assertEqual(status, 200)
        self.assertEqual(body["mode"], "verified")
        self.assertNotIn("test-human-token", json.dumps(body))
        self.assertNotIn("test-flow-token", json.dumps(body))
        self.assertEqual([call[1] for call in self.bridge.calls], ["/contact"])
        self.assertIsNotNone(self.cookie)

    def test_post_requires_same_origin_and_existing_browser_session(self):
        self.api("/bootstrap")
        status, body = self.api("/otp/send", {"mobile": ENQUIRY["mobile"], "consent": True}, origin=False)
        self.assertEqual(status, 403)
        status, _ = self.api("/otp/send", {"mobile": ENQUIRY["mobile"], "consent": True}, origin="https://other.example")
        self.assertEqual(status, 403)
        status, _ = self.api("/otp/send", {"mobile": ENQUIRY["mobile"], "consent": True}, cookie=False)
        self.assertEqual(status, 409)
        self.assertEqual(len(self.bridge.calls), 1)

    def test_otp_needs_consent_and_is_rate_limited(self):
        self.api("/bootstrap")
        status, _ = self.api("/otp/send", {"mobile": ENQUIRY["mobile"], "consent": False})
        self.assertEqual(status, 400)
        status, _ = self.api("/otp/send", {"mobile": ENQUIRY["mobile"], "consent": True})
        self.assertEqual(status, 200)
        status, body = self.api("/otp/send", {"mobile": ENQUIRY["mobile"], "consent": True})
        self.assertEqual(status, 429)
        self.assertGreater(body["retry_after"], 0)
        self.assertEqual(sum(call[1] == "/msg91-otp-api" for call in self.bridge.calls), 1)

    def test_submission_cannot_bypass_otp_or_human_confirmation(self):
        self.api("/bootstrap")
        status, body = self.api("/submit", ENQUIRY)
        self.assertEqual(status, 400)
        self.assertEqual(body["code"], "otp_required")
        self.verified()
        status, body = self.api("/submit", {**ENQUIRY, "human_confirm": False})
        self.assertEqual(status, 400)
        self.assertEqual(body["code"], "human_required")
        status, _ = self.api("/submit", {**ENQUIRY, "mobile": "9876543211"})
        self.assertEqual(status, 400)
        self.assertFalse(any(call[1] == "/mail" for call in self.bridge.calls))

    def test_success_needs_an_official_delivery_receipt_and_blocks_duplicates(self):
        self.verified()
        status, body = self.api("/submit", ENQUIRY)
        self.assertEqual(status, 200)
        self.assertTrue(body["delivered"])
        sent = next(call[2] for call in self.bridge.calls if call[1] == "/mail")
        self.assertEqual(sent["human_token"], "test-human-token")
        self.assertEqual(sent["msg91_otp_verified"], "1")
        self.assertEqual(sent["mobile"], "9876543210")
        status, _ = self.api("/submit", ENQUIRY)
        self.assertEqual(status, 409)
        self.assertEqual(sum(call[1] == "/mail" for call in self.bridge.calls), 1)

    def test_uncertain_delivery_is_not_claimed_as_success_or_retried(self):
        self.verified()
        self.bridge.fail_mail = True
        status, body = self.api("/submit", ENQUIRY)
        self.assertEqual(status, 504)
        self.assertEqual(body["code"], "delivery_unknown")
        self.assertFalse(body["ok"])
        status, _ = self.api("/submit", ENQUIRY)
        self.assertEqual(status, 409)
        self.assertEqual(sum(call[1] == "/mail" for call in self.bridge.calls), 1)

    def test_untrusted_redirect_is_not_a_success_receipt(self):
        self.verified()
        self.bridge.mail_location = "https://other.example/?consultation=success"
        status, body = self.api("/submit", ENQUIRY)
        self.assertEqual(status, 502)
        self.assertFalse(body["ok"])
        self.assertEqual(body["code"], "delivery_unknown")

    def test_browsers_do_not_share_verification(self):
        self.verified()
        first_cookie = self.cookie
        self.cookie = None
        self.api("/bootstrap")
        self.assertNotEqual(self.cookie, first_cookie)
        status, body = self.api("/submit", ENQUIRY)
        self.assertEqual(status, 400)
        self.assertEqual(body["code"], "otp_required")

    def test_upstream_mail_preserves_native_form_contract(self):
        captured = []
        class Response:
            status, headers = 200, {}
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self, limit): return b""
        class Opener:
            def open(self, req, timeout):
                captured.append(req)
                return Response()
        session = server_module.RemoteSession()
        session.opener = Opener()
        actual = server_module.ConsultationBridge()
        actual.upstream(session, "/mail", {"name": "Sample"})
        actual.upstream(session, "/msg91-otp-api", {"action": "send"})
        self.assertIsNone(captured[0].get_header("X-requested-with"))
        self.assertEqual(captured[1].get_header("X-requested-with"), "XMLHttpRequest")
        self.assertEqual(captured[0].full_url, "https://nakhsha.in/mail")

    def test_validation_rejects_invalid_fields_before_any_remote_submit(self):
        self.verified()
        for bad in ({"location": "Unknown"}, {"email": "not-an-email"}, {"budget": "invalid"},
                    {"name": "x"}, {"name": "Sample\nInjected"}, {"message": "x" * 1501}, {"consent": False}):
            status, _ = self.api("/submit", {**ENQUIRY, **bad})
            self.assertEqual(status, 400)
        self.assertFalse(any(call[1] == "/mail" for call in self.bridge.calls))


if __name__ == "__main__":
    unittest.main()
