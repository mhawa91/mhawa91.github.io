# Mahmoud Hawa Personal Website

This project is a lightweight personal portfolio site for Mahmoud Hawa, tailored to his professional profile in enterprise technology, digital transformation, and application portfolio management.

## Project structure

- `content.md` – **English site content.** Edit this file to change the English
  page (bio, stats, services, achievements, experience, education,
  certifications, entrepreneurship/investment activity, contact details). See
  the syntax guide in the comment at the top of the file.
- `ar/content.md` – **Arabic site content**, same structure/syntax as
  `content.md`, translated. Edit this to change the Arabic page.
- `index.html` – static page shell (nav, section containers, meta tags,
  language/theme toggle buttons). Rendered at runtime from whichever
  `content.md` is active — should rarely need editing for content changes.
- `assets/` – CSS, images, and JavaScript used by the site
- `media/` – local personal media and downloadable documents
- `docs/` – project documentation and architecture notes
- `lib/content-loader.js` – fetches the active language's `content.md`, parses
  it, and renders every section of the page; also owns the language switch
  (EN/AR, sets `dir="rtl"` for Arabic) and the light/dark theme toggle
- `lib/i18n.js` – dictionary of UI "chrome" strings (nav labels, buttons,
  section eyebrows — anything on the page that isn't resume content) in
  English and Arabic
- `hooks/` – reusable hooks or behavior scripts for future interactive enhancements
- `scripts/` – local automation scripts for development or deployment

## Editing content

1. Open `content.md` (English) or `ar/content.md` (Arabic).
2. Change the text, numbers, or add/remove an entry (a service, a job, a stat...).
3. Refresh the browser — no rebuild step, no HTML editing.

Adding/removing a UI label (nav item, button text, section eyebrow) instead of
resume content? Edit `lib/i18n.js` — every key needs both an `en` and `ar` value.

**In `ar/content.md`, keep company/institution names (`company`/`school`
attributes) in their original Latin spelling** — e.g. `"AL-AYUNI Investment &
Contracting Company (AICC)"`, not a guessed Arabic transliteration. Same rule
already applied to product names (Power BI, SAP, XCore). If a specific Arabic
spelling is ever wanted for one, get it from Mahmoud rather than guessing.

The site **must be served over http(s)** to load the content files (browsers
block `fetch()` from a plain double-clicked `file://` page). Use `start-site.ps1` /
`http://localhost:8000` locally, and any real static host once deployed.

## Language & theme

- The **AR/EN button** in the nav switches the whole page between English
  (LTR) and Arabic (RTL) — re-fetches and re-renders from the matching
  `content.md`, no reload.
- The **sun/moon button** toggles light/dark mode.
- Both choices persist across visits (stored in the browser's `localStorage`)
  and a tiny inline script in `<head>` applies them before first paint, so
  there's no flash of the wrong theme/language on reload.

## Local usage

From the project folder:

```powershell
./start-site.ps1
./status-site.ps1
./open-site.ps1
./stop-site.ps1
```

## Notes

- Keep content updated in `content.md` / `ar/content.md` — **not** `index.html`
- Keep styling updated in `assets/css/styles.css`
- Keep media in `media/`
- Use `PROJECT_MEMORY.md` for project notes and decisions

## Future goals

- Add richer portfolio case studies and achievements
- Add contact form or direct messaging integration
- Expand reusable frontend utilities in `lib/` and `hooks/`
- Design a proper Open Graph share-banner image (currently reuses the profile
  photo as a placeholder) and switch `og:image`/photo paths to absolute URLs
  once a real domain exists
- Pick a hosting target and deploy (nothing is published yet — the site only
  runs locally via `start-site.ps1`)
