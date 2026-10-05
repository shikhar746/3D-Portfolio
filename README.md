# Shikhar Srivastava — portfolio

A scroll-driven 3D portfolio. You fly along a neon DNA helix whose base pairs encode the name
"SHIKHAR SRIVASTAVA" (2 bits per base, A=00 C=01 G=10 T=11). Cards for each section pop out of
atoms on the strand, each project opens a full "file", and a 2D version shows the same content as a
normal scrolling page.

Built with Vite + TypeScript (strict) and three.js. No framework.

## Commands

```bash
npm install
```

```bash
npm run dev
```

Dev server at http://localhost:5173.

```bash
npm run build
```

Type-checks, then builds the static site into `dist/`. Preview the build with `npm run preview`.

```bash
npm run update-stats
```

Refreshes the LeetCode and Codeforces numbers in `src/data/cp-stats.json` from the public APIs. The
deploy workflow also runs it before every build and redeploys weekly, so the live site stays current.

## Structure

```
index.html            page markup only (cards, footer, overlay shell, navbar); loads src/main.ts
public/               copied to the site root as-is
  assets/             project screenshots
  favicon.svg, og-image.jpg, robots.txt, Shikhar_Srivastava_Resume.pdf
src/
  main.ts             entry: fonts + styles, creates the app, lazy-loads the 3D scene, slow-network watchdog
  app.ts              app shell: wires the UI modules, 3D/2D switch, fallback, easter egg
  types.ts            shared types (Project, Profile, App, ...)
  data/content.ts     all text: profile, skills, projects  <- edit content here
  data/cp-stats.json  LeetCode / Codeforces stats (written by scripts/update-cp-stats.mjs)
  lib/                dom helpers, DNA encoding, scramble effect, environment flags
  ui/                 boot screen, navbar, project overlay, 2D version, 2D helix, sound, toast, konami
  scene/scene.ts      the three.js scene (its own chunk, loaded after the page is usable)
  styles/             one CSS file per area; index.css imports them in cascade order
```

## Editing content

- Project details, profile, skills: `src/data/content.ts`.
- 3D card text (about, skills, project summaries): the `.slot` blocks in `index.html`.
- Contact links: the `<footer id="foot">` list in `index.html`. The 2D version copies them from there.
- Adding a section: add another `.slot` block. The helix spacing, navigation dots and HUD adjust
  automatically; increase `#scroller` height in `src/styles/base.css` if sections feel rushed.

## Deploy (GitHub Pages, free)

The workflow in `.github/workflows/deploy.yml` builds and publishes the site on every push to `main`.

```bash
gh auth login
```

```bash
gh repo create shikhar746.github.io --public --source . --push
```

```bash
gh api -X POST repos/shikhar746/shikhar746.github.io/pages -f build_type=workflow
```

Then re-run the workflow once (Actions tab, or `gh workflow run deploy.yml`). The site goes live at
https://shikhar746.github.io.

Alternatives: import the repo at vercel.com/new or netlify.com (both detect Vite: build command
`npm run build`, output directory `dist`).

### After deploying

1. In `index.html`, change `og-image.jpg` in the `og:image` and `twitter:image` tags to the full URL,
   e.g. `https://shikhar746.github.io/og-image.jpg`, and add
   `<link rel="canonical" href="https://shikhar746.github.io/">`. Link previews need absolute URLs.
2. Add the site URL to the résumé, GitHub profile and LinkedIn.

## Notes

- three.js is pinned to 0.128.0, the same release the site used from a CDN. Newer releases changed
  default lighting and colour management, so upgrading needs a visual pass (light intensities,
  `renderer.outputColorSpace`).
- The 3D scene is a separate lazily loaded chunk. If it fails to download the page switches to the
  2D version; if it takes over 6 seconds the 2D version opens and the 3D view is offered when it arrives.

## Features

- Competitive programming section with live-refreshed LeetCode and Codeforces stats
- Top navbar (about, skills, competitive programming, projects, contact, résumé) that highlights the current section; collapses to a menu on phones
- 3D / 2D switch in the navbar. The 2D version remembers each visitor's choice, opens with `?view=2d`,
  and is used automatically when 3D is unavailable or too slow to load
- Boot sequence, glitch titles and a HUD that decodes the name as you fly
- Navigation dots on the right edge; deep links such as `/#loop` or `/#contact` jump straight there
- Optional synth sound (off by default)
- Respects "reduce motion" settings
- Try the Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
