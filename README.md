# Nakhsha — Built beyond the ordinary

A cinematic commercial architecture website. Deep forest, muted gold, editorial serif typography, and immersive project photography. Built with native HTML, CSS, JavaScript, SVG, and locally hosted fonts. No build step or runtime dependencies.

![Desktop preview](docs/desktop-preview.png)

## Run

```sh
python -m http.server 3000 --bind 0.0.0.0
```

Open the server in your browser. `index.html` is the editable site. `standalone.html` embeds the fonts and photographs for a self-contained version. Regenerate it after edits:

```sh
python scripts/export.py
```

## Experience

- Full-screen architectural opening with subtle ambient movement and a building-mark loader.
- Spring-driven, staggered headline reveals and editorial scroll reveals.
- A pinned, full-screen project sequence on desktop, with spring-driven photographic dissolves, subtle image movement, project navigation, and detail dialogs.
- Individual project chapters on mobile and when reduced motion is enabled.
- Full-screen keyboard-accessible navigation, native modal focus handling, Escape to close, and a motion control.
- Direct telephone/email contact links, without an unconnected enquiry form.

The supplied KIMI / GRIDO1 reference informed the spring solver, loading handover, oversized type, layered photographic presentation, and scroll sequence. The racing content and helmet effects are reinterpreted for architecture rather than copied into this site. No racing assets or Three.js scene are included.

## Verified content and imagery

Project names, locations, descriptions, and photographs were sourced from Nakhsha's official portfolio:

- https://nakhsha.in/nakhsha-builders
- https://nakhshabuilders.com/
- https://nakhshabuilders.com/projects/iconic-resto-pub
- https://nakhshabuilders.com/projects/cosmopolitan-club

The six selected projects are Mysore Union, Cosmopolitan Club, Iconic Resto Pub, MICA, Continental Inn, and Rahul Cafe. Summaries are paraphrased from those pages. The commercial-project milestone, founding year, and contact details come from nakhsha.in/nakhsha-builders. No price or availability claims are made.

The hero tower is a generated architectural concept, labeled on the website. It is not represented as a Nakhsha project. The geometric symbol is a design concept. Actual project photography is used in the project collection. Sources were accessed on 26 October 2026.

Manrope and Cormorant Garamond are locally hosted under the SIL Open Font License; see `assets/OFL.txt` and `assets/EDITORIAL-OFL.txt`.

## Validation

Chromium checks cover the loader, headline entrance, full-screen navigation, desktop project selection, detail dialogs, mobile chapters, motion toggle, reduced-motion presentation, image loading, and layouts at 375, 390, 768, and 1440 pixels with no horizontal overflow. The self-contained export is checked with all external asset requests blocked.
