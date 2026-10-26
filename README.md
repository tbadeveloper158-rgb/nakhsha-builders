# Nakhsha Builders

A responsive architectural website built with HTML, CSS, and JavaScript. No dependencies or build step.

## Run

From `/workspace/nakhsha-builders`:

```sh
python -m http.server 3000 --bind 0.0.0.0
```

`index.html` is the editable site, with locally hosted assets. `standalone.html` is the self-contained export, including all photographs and the font. It can also be opened directly. Regenerate the export after editing the site or assets with `python scripts/export.py`.

## Content and photography

Project names, locations, scope summaries, and photographs were retrieved from these official pages on 26 October 2026:

- https://nakhsha.in/nakhsha-builders
- https://nakhshabuilders.com/
- https://nakhshabuilders.com/projects/iconic-resto-pub
- https://nakhshabuilders.com/projects/cosmopolitan-club

The six selected projects are Mysore Union, Cosmopolitan Club, Iconic Resto Pub, MICA, Continental Inn, and Rahul Cafe. Project details are paraphrased from the official sites. No prices or availability are claimed. The dramatic tower in the hero is an AI-generated architectural concept, labeled on the page, and is not a Nakhsha project. The geometric brand symbol is a design concept.

The contact dialog uses the phone number, email, and address published on nakhsha.in. Calls and emails use native links. No enquiry submission or backend integration is implied.

The locally hosted Manrope variable font is distributed under the SIL Open Font License; see `assets/OFL.txt`.

## Interaction and accessibility

- Hero perspective controls, category filtering, and project detail dialogs.
- Mobile navigation with expanded-state reporting.
- Native modal keyboard/focus handling, Escape to dismiss, keyboard focus styles.
- Reduced-motion support, lazy-loaded project photos, and no external runtime requests.

Browser validation: Chromium at widths of 375, 390, 768, and 1440 pixels; verified image loading, navigation, filters, carousel, project/contact dialogs, reduced-motion visibility, and no horizontal overflow.

## Adaptation of the supplied KIMI / GRIDO1 prompt

The racing reference is reinterpreted for commercial architecture, using the same motion ideas with Nakhsha content and warm ivory, charcoal, and copper art direction:

- Architectural loading veil and progress meter, gated on hero image and font readiness with a fallback.
- One animation ticker with a mass-one damped spring solver and 1ms integration.
- Staggered headline word reveals, scroll-entry reveals, and desktop sticky hero recession to 90% scale with a darkening overlay.
- Animated contour fields, cursor-revealed structural linework, and blueprint tracing in place of the helmet and circuit.
- Staggered portfolio photography and a four-stage delivery roadmap with a traced progress thread.
- Reduced-motion and touch layouts, without racing assets or racing copy.

This is an architectural adaptation, not an exact reproduction of the racing site's WebGL helmet scene. It uses native canvas/SVG and JavaScript, with no Three.js, remote modules, bundler, or runtime dependency.

## ZIP contents

`index.html`, `standalone.html`, local imagery/font and font license in `assets/`, this README, and `scripts/export.py`. No Git metadata, credentials, or environment files are packaged.
