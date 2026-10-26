# Nakhsha Builders — the architectural layout, in cream and beige

The previous interactive-tower composition is restored: the central architectural subject, bracketed panels, pinned sheets, traced floor plan, stepped photographic timeline, process strip and framed closing chapter. Its black/cyan styling is replaced throughout by **cream, beige, warm stone, bronze and readable brown text**.

![Restored tower layout in cream and beige](docs/desktop-preview.png)

## Motion preview

This recording shows the actual browser experience, including the tower interaction, traced floor plan and live photographic plates.

![Actual animation preview](docs/motion-preview.gif)

## Animation throughout

- A warm architectural loader and staggered letter/word entrances.
- A WebGL crown-to-base tower reveal, bronze structural scan, cursor-trail reveal, subtle depth, gentle floating and an idle sweep on touch screens.
- Continuously evolving contour fields and the original pinned-sheet recession, recolored in warm neutrals.
- A six-second bronze floor-plan trace, moving grid, reticle, hub rings and pulsing milestones.
- Living project plates: parallax, gentle image movement, rotating published photographs and spring-driven photo crossfades while visible. Hover/focus pauses the relevant plate.
- Five-photo project dialogs with next/previous, keyboard, swipe and thumbnail navigation.
- Cycling process highlights and a scroll-responsive closing architectural figure.

The global motion control and system reduced-motion preference are retained. On reduced motion, the page uses normal scrolling and still, manually browsable galleries. Too-tall screens also use normal flow so actions remain reachable.

The working consultation form and the verified project galleries from the newer version remain included.

## Run

Python 3.10+, no package dependencies:

```sh
python server.py --port 3000
```

This serves the prebuilt website and the verified consultation API from the same origin. `index.html` and the identical `standalone.html` embed all local imagery, fonts, Three.js 0.185.0 and Lenis 1.3.26; viewing them requires no frontend build, installation or CDN downloads.

A static-only host cannot run the verified form API. It instead offers an explicitly labelled email-draft action and the official-form link, without claiming an enquiry was sent. Run/deploy the included backend for direct verification and submission. This code update does not publish the website to a public domain.

## Consultation flow

The form collects name, phone, email, location, project type, budget, message and contact consent, matching the published Nakhsha form.

The companion backend maintains a separate official PHP session for each browser. It fetches current public verification tokens server-side, relays **user-requested** WhatsApp OTP send/verify actions, and submits to the official consultation handler only after successful mobile verification and human confirmation. Session tokens and cookies stay in server memory and are never embedded in HTML or returned to the browser.

There are no automatic OTP sends or automatic enquiries. Server validation, same-origin checks, bounded payloads, session expiry, resend/verification limits and duplicate protection are included. Success is shown only after the official handler returns its recognised delivery receipt; an uncertain result is not reported as success or blindly retried.

The official PHP interface is public but undocumented and may change; failures provide a visible alternative instead of claiming delivery. For HTTPS hosting, use a reverse proxy with `X-Forwarded-Proto: https` or set `NAKHSHA_SECURE_COOKIE=1` so the session cookie is Secure. The Python process must remain running for direct submissions.

**Verification performed:** live read-only bootstrap against the official site; 10 mocked backend tests; actual-page mocked mobile tests covering consent, validation, OTP errors/recovery, human confirmation, confirmed/uncertain delivery and static fallback. **No real OTP or enquiry was sent during development**, so live message delivery is not claimed as tested.

## Edit and build

- `src/index.template.html`, `src/site.css`, `src/site.js`: restored composition and warm motion system.
- `src/contact.css`, `scripts/contact-form.js`: retained consultation form styling and integration.
- `scripts/contour-field.js`, `scripts/drafting-canvas.js`: warm animated canvas helpers, sharing the page ticker.
- `project-data.json`, `project-media.json`: verified content, source URLs, videos and photographs.
- `server.py`, `tests/test_contact.py`: session-preserving backend and mocked tests.

After editing:

```sh
python scripts/export.py
```

Backend checks:

```sh
python -m unittest discover -s tests -v
```

## Content and assets

Project details and photographs come from https://nakhsha.in/nakhsha-builders and the original https://nakhshabuilders.com project pages recorded in the JSON files. The six projects are Mysore Union, Cosmopolitan Club, Continental Inn, Iconic Resto Pub, MICA and Rahul Cafe. Thirty published photographs are embedded. Four projects have verified official films; no film link is invented for the others.

The central tower is a generated architectural concept, clearly labelled on the page, and is not represented as a built Nakhsha project. Actual project photography is used in the photographic plates and galleries. The official company symbol is masked to the warm palette. Oswald and Space Grotesk licenses are in `assets/`; the two pinned libraries retain MIT notices in `vendor/` and were extracted from SHA512-verified npm packages.

## Validation

Independent Chromium checks passed at 1440×1000 desktop, 390×844 touch and 375×667 touch: no horizontal overflow, actual WebGL ready, reachable short-screen CTA, working menus/Escape, five-photo gallery controls, enquiry anchor to the actual form, and reduced-motion normal flow. All major page surfaces were checked as cream/beige, with warm brown text. There were no page or console errors.

A timed browser check confirmed the photographic plate changes from PHOTO 01 to PHOTO 02 through the automatic crossfade. The actual-page contact flow was tested with intercepted API responses: field validation, consent, OTP, human confirmation, confirmed/uncertain delivery and the honest static email fallback. No production OTP/enquiry sends were made.

## Screenshots

[Desktop](docs/desktop-preview.png) · [Phone](docs/mobile-preview.png) · [Animated plan](docs/blueprint-preview.png) · [Project plates](docs/projects-preview.png) · [Gallery](docs/gallery-preview.png) · [Contact](docs/contact-preview.png)
