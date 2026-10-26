# Nakhsha — Spaces with presence

A warm, cinematic commercial-project website in **cream, beige, ivory, warm stone and bronze**, using the colour family on nakhsha.in. All project photography is from Nakhsha’s published work. No black panels, cyan, or blue interface accents.

![Cream and beige opening](docs/desktop-preview.png)

## Run the complete website and contact form

Python 3.10+; no package dependencies:

```sh
python server.py --port 3000
```

This serves the prebuilt website and the consultation API from the same origin. Images, fonts, Three.js and Lenis are embedded into `index.html`; no frontend build or CDN request is required.

`standalone.html` is an identical self-contained frontend. A static-only host cannot run the verified consultation API; its form switches to an explicitly labelled **Prepare email enquiry** action and an official-form link. It never claims an email draft has been sent. Run/deploy `server.py` for direct, verified submissions. The site has not been deployed to a public domain by this repository update.

## A different way to explore the projects

- A moving architectural opening using real Cosmopolitan Club, Continental Inn and Rahul Cafe photography, a refracted WebGL photo transition, subtle pointer depth and a floating detail study.
- A scroll-led project cinema on desktop, replacing the old static project timeline. Six projects dissolve through a large photographic stage, with project navigation, progress and a direct exploration control.
- An interactive project carousel on phones and shorter screens, with swipe, previous/next and thumbnail controls.
- Five photographs per project: 30 original published images in total, including 24 additional gallery photographs. Gallery thumbnails, arrow keys, swipe and next/previous controls all work.
- Four official project films, linked only where the published video has been verified.
- A process accordion that changes its photographic study, letter/word entrances, parallax and ambient movement. A motion control and system reduced-motion preference preserve a calmer, fully usable version.
- Full-screen navigation and a warm consultation section.

Photographs retain their actual colours; sky, water and materials in project photography are not interface accents.

## Consultation flow

The form collects name, phone, email, location, project type, budget, message and contact consent, matching the published Nakhsha form.

The companion backend maintains a separate official PHP session for each browser. It fetches current public verification tokens server-side, relays **user-requested** WhatsApp OTP send/verify actions, and submits to the official consultation handler only after successful mobile verification and human confirmation. Session tokens and cookies stay in server memory and are never embedded in HTML or returned to the browser.

There are no automatic OTP sends or automatic enquiries. Server validation, same-origin checks, bounded payloads, session expiry, resend/verification limits and duplicate protection are included. Success is shown only after the official handler returns its recognised delivery receipt; an uncertain result is not reported as success or blindly retried.

The official PHP interface is public but undocumented and may change; failures provide a visible alternative instead of claiming delivery. For HTTPS hosting, use a reverse proxy with `X-Forwarded-Proto: https` or set `NAKHSHA_SECURE_COOKIE=1` so the session cookie is Secure. The Python process must remain running for direct submissions.

**Verification performed:** live read-only bootstrap against the official site; 10 mocked backend tests; actual-page mocked mobile tests covering consent, validation, OTP errors/recovery, human confirmation, confirmed/uncertain delivery and static fallback. **No real OTP or enquiry was sent during development**, so live message delivery is not claimed as tested.

## Authoring

- `src/index.template.html`, `src/site.css`, `src/site.js`: editable frontend.
- `scripts/contact-form.js`: progressive verified-form integration.
- `project-data.json`, `project-media.json`: verified project information, gallery paths, film links and original source URLs.
- `server.py`: static serving and session-preserving consultation bridge.
- `tests/test_contact.py`: mocked server tests; never sends production messages.

Regenerate the delivered HTML after editing:

```sh
python scripts/export.py
```

Run backend tests:

```sh
python -m unittest discover -s tests -v
```

## Sources and licensing

Project content and photographs were retrieved from:

- https://nakhsha.in/nakhsha-builders
- https://nakhshabuilders.com/ and its original project detail pages, recorded individually in the JSON files.

The six projects are Mysore Union, Cosmopolitan Club, Continental Inn, Iconic Resto Pub, MICA and Rahul Cafe. No prices, sale availability or invented completion dates are claimed. The current design uses actual project photography throughout; it does not present generated buildings as Nakhsha projects.

The official Nakhsha symbol is colour-masked to the warm palette. Plus Jakarta Sans and Cormorant Garamond are locally included under the SIL Open Font License (`assets/`). Three.js 0.185.0 and Lenis 1.3.26 retain their MIT notices in `vendor/`; vendored code was extracted from SHA512-verified npm packages.

## Previews

[Desktop](docs/desktop-preview.png) · [Phone](docs/mobile-preview.png) · [Project cinema](docs/projects-preview.png) · [Gallery](docs/gallery-preview.png) · [Consultation form](docs/contact-preview.png)

## Frontend validation

Chromium checks passed for both WebGL scenes, hero controls, six project selectors, five-photo galleries, gallery keyboard/thumbnail controls, process accordion, mobile navigation and project browsing, reduced-motion controls, and the embedded standalone gallery assets. Layouts were checked at 375×667, 390×844, 768×1024, 1280×720, 1440×1000 and 1920×1080 with no horizontal overflow. Real touch-phone tests compare scroll width against the layout viewport, and mobile inputs use 16px text to prevent focus zoom.
