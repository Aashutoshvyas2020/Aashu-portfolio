# Aashu Portfolio

Personal portfolio of Aashutosh Vyas: selected software projects, research, photography, education, and contact information.

Static HTML, CSS, and JavaScript. No framework, build step, backend, or production dependencies.

## Run locally

Requires Python 3. For browser tests, also install Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The server binds to loopback and serves only `public/`.

## Browser tests

Keep the local server running in another terminal:

```sh
npx playwright install chromium
npm test
```

To use an existing Chrome installation, set `CHROME_PATH` to its executable. Set `BASE_URL` when testing a server on another address.

Tests exercise project navigation, browser history, return focus, responsive menus, and one-section-per-gesture scrolling.

## Structure

```text
public/
  index.html       Content, navigation, and detail pages
  styles.css       Layout, responsive styles, and transitions
  script.js        Navigation, previews, history, and gestures
  images/          Referenced photographs and project captures
  fonts/           JetBrains Mono and its license
tests/
  portfolio.test.mjs
```

Edit content in `public/index.html`. Detail links use matching article `data-project` values; `data-section` identifies the section to return to. Project preview images use `data-preview`; add `data-preview-format="portrait"` for a tall, uncropped app screenshot rather than a landscape thumbnail.
CSS and JavaScript URLs include content-hash versions. Update the matching `?v=` value in `index.html` when changing either file so existing browser tabs fetch the new asset.

Main sections advance once per wheel burst, using 70ms of silence to identify a new gesture. Detail pages retain native scrolling. Photography and book details use uncropped images and responsive editorial layouts.

## Deployment

Publish the contents of `public/` on any static host. There is no build command. Keep the relative image, font, stylesheet, and script paths intact.

## Media and rights

Photography and book artwork are by Aashutosh Vyas. Project captures show the actual sites or apps; Duo Fold uses a frame from its YC Bitrig Hacks demo, and Atlas shows its offline interface. Misty Meadow comes from the [Point of Arrival collection](https://aashutoshvyas.com/point-of-arrival?photo=p9).

JetBrains Mono is distributed under the [SIL Open Font License](public/fonts/OFL.txt). Public repository access does not grant a separate license to reuse photographs, artwork, or other portfolio content.
