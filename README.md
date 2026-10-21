# Youssef El Harchaoui — Architecture portfolio

Static website (HTML, CSS, JS). No build step, no framework.

## Structure

```
index.html              Home: hero, profile, projects, experience, FAQ, contact
404.html                Page shown for broken links
projects/               One page per project (6)
assets/
  css/styles.css        All styles
  js/main.js            Interactions (slideshow, tabs, viewer, timeline, header)
  js/i18n-fr.js         French text — keys match the data-i18n attributes in the HTML
  img/<project>/        WebP images; -800 / -1400 / -240 files are smaller copies for phones
  og/                   1200×630 preview images for LinkedIn / WhatsApp link sharing
  brand/                Logos (black / white) and favicons
  docs/                 CV (PDF)
llms.txt                Plain-text profile for AI assistants (ChatGPT, Claude, Perplexity…)
robots.txt              Lets search engines and AI crawlers in
site.webmanifest        Icons and colours for phones
vercel.json             Hosting settings: caching and security headers
.vercelignore           Keeps source/ and this README off the server
source/                 Original PDFs, zips, logo files — never uploaded
```

## Deploying on Vercel

1. Create a new project on vercel.com and import this folder (or drag it in with the Vercel CLI: `vercel --prod`).
2. Framework preset: **Other**. No build command, output directory: the project root.
3. Once the address is known (e.g. `youssef-el-harchaoui.vercel.app` or your own domain), add it to:
   - each page's `<head>`: `<link rel="canonical" href="https://YOUR-DOMAIN/…">` and absolute `og:image` URLs,
   - a `sitemap.xml`, referenced at the bottom of `robots.txt`.

## Editing

- **Text:** edit the HTML. If the element has `data-i18n="key"`, also edit the French line with the same key in `assets/js/i18n-fr.js`.
- **CSS or JS changes:** bump the `?v=` number on the `styles.css` / `main.js` / `i18n-fr.js` links in every page, otherwise visitors keep the cached copy for up to a year.
- **Images:** replace the `.webp` file and its `-800` / `-1400` copies with images of the same proportions.
