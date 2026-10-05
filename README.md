# Shikhar Srivastava — portfolio

A scroll-driven 3D portfolio. You fly along a neon DNA helix whose base pairs encode the name
"SHIKHAR SRIVASTAVA" (2 bits per base, A=00 C=01 G=10 T=11). Cards for each section pop out of
atoms on the strand, and each project opens a full "file" with screenshots, features and stack.

Static site: plain HTML, CSS and JavaScript plus three.js from a CDN. No build step.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole site: styles, content and scripts |
| `assets/` | Project screenshots (`loop.webp`, `minnerva.webp`) |
| `Shikhar_Srivastava_Resume.pdf` | Résumé linked from the site |
| `og-image.jpg` | 1200×630 preview image for link shares (LinkedIn, WhatsApp, X) |
| `favicon.svg` | Browser tab icon |
| `robots.txt` | Lets search engines index the site |

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173. Opening `index.html` directly also works.

## Deploy (GitHub Pages, free)

```bash
gh auth login
gh repo create shikhar746.github.io --public --source . --push
gh api -X POST repos/shikhar746/shikhar746.github.io/pages -f "source[branch]=main" -f "source[path]=/"
```

The site goes live at https://shikhar746.github.io within a minute or two.

Alternatives: import the repo at vercel.com/new (framework preset "Other"), or drag the folder onto
app.netlify.com/drop.

## After deploying

1. In `index.html`, change `og-image.jpg` in the `og:image` and `twitter:image` tags to the full URL,
   e.g. `https://shikhar746.github.io/og-image.jpg`, and add
   `<link rel="canonical" href="https://shikhar746.github.io/">`. Link previews need absolute URLs.
2. Add the site URL to the résumé, GitHub profile and LinkedIn.
3. Check the preview with https://www.opengraph.xyz.

## Editing content

- Card text (about, skills, project summaries): the `.slot` blocks in `index.html`.
- Project details, the plain view and profile data: `PROFILE` and `PROJECTS` near the top of the first script.
- Contact links: the `<footer id="foot">` list. The plain view copies them from there.
- Adding a section: add another `.slot` block. The helix spacing, navigation dots and HUD adjust
  automatically; increase `#scroller` height if sections feel rushed.

## Features

- Boot sequence, glitch titles and a HUD that decodes the name as you fly
- Navigation dots on the right edge; deep links such as `/#loop` open a project directly
- Plain view (top-left) with all content as a normal page; used automatically when 3D is unavailable
- Optional synth sound (off by default)
- Respects "reduce motion" settings
- Try the Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
