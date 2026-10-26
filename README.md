# Nakhsha Builders — a scroll-directed architectural experience

A cream-and-beige architectural website with Nakhsha’s **exact official preloader logo**, a genuine 3D building study, distinct published photography, and project-led enquiry tools.

![3D architectural opening](docs/desktop-preview.png)

## Motion preview

Actual browser recording of the model changing position, rotating, separating its floors and revealing feature descriptions as the page scrolls.

![Actual 3D scroll-story recording](docs/motion-preview.gif)

## What changed

- The loader now uses the full official Nakhsha artwork, unchanged: gold symbol, registered wordmark and family line. Source: https://nakhsha.in/assets/images/nakhsha-preloader-logo.png?v=20260925-preloader-text-removed-1. The embedded bytes were checked against the original asset.
- The hero is actual volumetric geometry: 23 tower levels, curved floor fins, glazing, mullions, a stepped podium, roof volumes, planting, lighting and shadows. It is an illustrative architectural concept, clearly labelled, and does not represent an existing Nakhsha development.
- Four scroll chapters change the model’s camera/orientation and reveal descriptions and projected detail markers: overall form, arrival, separated floor structure and terraces. Viewpoint buttons offer direct navigation, including manual views on short screens and reduced-motion devices.
- The former repeated tower photograph is removed from every section. The process chapter uses a Continental Inn lobby photograph; the closing chapter uses the Iconic Resto Pub night exterior. Real project photographs continue throughout the portfolio.
- Project filters select all, hospitality or institutional work. Five-photo galleries support thumbnails, arrows, swipe and keyboard navigation. Enquiry links carry the selected project context into the contact form without overwriting an existing message.
- Warm contours, the traced floor plan, spring entrances, live photographic plates and the original warm architectural composition remain. Offscreen/covered 3D rendering pauses to preserve resources.

## Run

Python 3.10+, no package dependencies:

```sh
python server.py --port 3000
```

This serves the prebuilt site and the verified consultation API from one origin. `index.html` and the identical `standalone.html` embed all required local imagery, fonts, Three.js 0.185.0, Lenis 1.3.26 and the model geometry code. No frontend build, remote model, runtime CDN request or package installation is required to view the page.

A static-only host cannot run the verified form API. Its form offers an explicitly labelled email-draft action and the official contact-page link, without claiming a message was sent. Run/deploy the included backend for direct verified submissions. This code update does not deploy the site to a public domain.

## Consultation flow

The form collects name, phone, email, location, project type, budget, message and contact consent, matching the published Nakhsha form.

The companion backend maintains a separate official PHP session for each browser. It fetches current public verification tokens server-side, relays **user-requested** WhatsApp OTP send/verify actions, and submits to the official consultation handler only after successful mobile verification and human confirmation. Session tokens and cookies stay in server memory and are never embedded in HTML or returned to the browser.

There are no automatic OTP sends or automatic enquiries. Server validation, same-origin checks, bounded payloads, session expiry, resend/verification limits and duplicate protection are included. Success is shown only after the official handler returns its recognised delivery receipt; an uncertain result is not reported as success or blindly retried.

The official PHP interface is public but undocumented and may change; failures provide a visible alternative instead of claiming delivery. For HTTPS hosting, use a reverse proxy with `X-Forwarded-Proto: https` or set `NAKHSHA_SECURE_COOKIE=1` so the session cookie is Secure. The Python process must remain running for direct submissions.

**Verification performed:** live read-only bootstrap against the official site; 10 mocked backend tests; actual-page mocked mobile tests covering consent, validation, OTP errors/recovery, human confirmation, confirmed/uncertain delivery and static fallback. **No real OTP or enquiry was sent during development**, so live message delivery is not claimed as tested.

## Authoring

- `src/index.template.html`, `src/site.css`, `src/site.js`: layout, chapters, navigation, galleries and motion.
- `scripts/architectural-model.js`: real Three.js geometry, physical materials, lighting, framing, floor separation and projected hotspots; no private animation loop.
- `scripts/contour-field.js`, `scripts/drafting-canvas.js`: warm canvas helpers sharing the page ticker.
- `src/contact.css`, `scripts/contact-form.js`, `server.py`: retained consultation experience and session-preserving backend.
- `project-data.json`, `project-media.json`: verified content, photo provenance and official film links.

After editing:

```sh
python scripts/export.py
```

Backend checks (mocked; do not send production enquiries):

```sh
python -m unittest discover -s tests -v
```

The delivered HTML files are prebuilt and can be opened/served immediately.

## Published work and imagery

Project data comes from https://nakhsha.in/nakhsha-builders and the original https://nakhshabuilders.com project pages recorded in the JSON files. The collection covers Mysore Union, Cosmopolitan Club, Continental Inn, Iconic Resto Pub, MICA and Rahul Cafe. Thirty published photographs are embedded. Four projects have verified official films; no film link is invented for the others.

The 3D concept is created from geometry, not a photograph or screenshot billboard. Source factory statistics show 23 tower floors, 29 mesh objects, 13 instanced batches and approximately 107,560 triangles; the tested renderer reported 58 draw calls with desktop shadows and 31 on mobile. These are implementation statistics, not claims about a built project.

Nakhsha’s official logo is retained in its original colours in the preloader. Interface colours remain cream, beige, warm stone and bronze. Oswald/Space Grotesk licenses are in `assets/`; pinned library MIT notices are in `vendor/`, with the libraries extracted from SHA512-verified npm packages.

## Validation

Chromium checks passed for exact logo-byte embedding, genuine 3D geometry rendering, wheel-driven progress, all four model poses with readable descriptions, projected detail markers, sector filters, five-photo galleries, project-specific enquiry handoff, and useful WebGL-disabled fallback.

Layouts were checked at 375×667, 390×844, 768×1024, 1280×720, 1440×1000 and 1920×1080 with no horizontal overflow. Real touch tests verify the roof clears metadata, controls remain reachable, short screens have no blank scroll runway, and reduced-motion viewers retain manual viewpoint controls. Normal runs had no page or console errors, and no external asset requests.

The verified contact flow is unchanged; actual-page API tests are mocked, with no production OTP or enquiry sends.

## Screenshots

[Official preloader](docs/preloader-preview.png) · [Desktop](docs/desktop-preview.png) · [Phone](docs/mobile-preview.png) · [Arrival](docs/model-view-1.png) · [Structure](docs/model-view-2.png) · [Terraces](docs/model-view-3.png) · [Distinct process imagery](docs/process-preview.png) · [Distinct closing imagery](docs/footer-preview.png) · [Projects](docs/projects-preview.png) · [Contact](docs/contact-preview.png)
