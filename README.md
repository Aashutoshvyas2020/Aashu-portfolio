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

Edit content in `public/index.html`. Detail links use matching article `data-project` values; `data-section` identifies the section to return to. Project preview images use `data-preview`; add `data-preview-format="portrait"` for a tall, uncropped app screenshot with an iPhone-style bezel. Landscape previews sit inside a CSS midnight MacBook frame. Device frames reuse the original images and require no additional assets.
CSS and JavaScript URLs include content-hash versions. Update the matching `?v=` value in `index.html` when changing either file so existing browser tabs fetch the new asset.

Main sections advance once per wheel burst, using 70ms of silence to identify a new gesture. Up/down arrows move one section per press without wrapping at the ends; holding a key does not skip sections. Modified arrows, editable fields, open mobile menus, and detail pages retain native keyboard behavior. Detail pages retain native scrolling. Photography and book details use uncropped images and responsive editorial layouts.

## Deployment

Publish the contents of `public/` on any static host. There is no build command. Keep the relative image, font, stylesheet, and script paths intact.

Production: [aashu.xyz](https://aashu.xyz), on the existing Netlify site `aashu-portfolio-274`. Deploy from the repository root with an authenticated Netlify CLI:

```sh
netlify deploy --site 3dd855ad-e5aa-45bc-bdc6-3668761f8694 --dir public --no-build --prod
BASE_URL=https://aashu.xyz npm test
```

Production deployment is manual; pushing GitHub alone does not publish the site. Netlify retains previous deploys for rollback.

## Media and rights

Photography and book artwork are by Aashutosh Vyas. Project captures show the actual sites or apps; Duo Fold uses a frame from its YC Bitrig Hacks demo, Atlas shows its offline interface, and Starline uses the supplied screenshot of its live sign-in screen. Misty Meadow comes from the [Point of Arrival collection](https://aashutoshvyas.com/point-of-arrival?photo=p9).

JetBrains Mono is distributed under the [SIL Open Font License](public/fonts/OFL.txt). Public repository access does not grant a separate license to reuse photographs, artwork, or other portfolio content.
