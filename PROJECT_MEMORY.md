# Project Memory

## Overview
This repository contains the personal website for Mahmoud Hawa, built as a content-driven HTML/CSS/JS portfolio tailored to his enterprise technology profile. All page content is authored in `content.md`; `index.html` is a static shell that `lib/content-loader.js` populates at page load by parsing `content.md`.

## Purpose
The site serves as a personal landing page and digital presence for:
- enterprise technology leadership
- digital transformation strategy
- application portfolio governance
- business intelligence and analytics leadership
- executive profile and contact access

## Project folders
- `assets/` – static frontend assets (`css/`, `js/`, `img/` incl. favicon)
- `ar/` – Arabic content (`ar/content.md`), mirrors `content.md`'s schema
- `media/` – copied resume PDF and personal photo
- `docs/` – documentation and design notes
- `lib/` – content parsing/rendering (`content-loader.js`) and i18n (`i18n.js`)
- `hooks/` – reusable behavior hooks for front-end enhancements
- `scripts/` – operational automation or future build scripts

## Current stack
- HTML
- CSS
- JavaScript
- Python local server for preview
- PowerShell scripts for start / stop / status / open controls

## Important files
- `content.md` – **single source of truth for English page content.** Edit
  this to change bio, stats, services, achievements, experience, education,
  certifications, entrepreneurship/investment section, or contact details.
  Syntax guide is in the comment block at the top of the file.
- `ar/content.md` – same, for Arabic. Company/institution names are kept in
  Latin spelling (never a guessed transliteration) — see the 2026-09-03
  accuracy-fix note below.
- `lib/i18n.js` – dictionary of UI "chrome" strings (nav, buttons, eyebrows)
  in en/ar — edit here for label changes, not content.md.
- `index.html` – static page shell (nav + empty section containers, logo,
  language/theme toggle buttons), rendered from the active `content.md` at
  load time. Rarely needs editing.
- `lib/content-loader.js` – parses `content.md`/`ar/content.md`, renders
  every section, owns the language switch and theme toggle
- `assets/css/styles.css` – design, layout, and theme variables
- `assets/js/main.js` – nav scroll-spy + back-to-top button
- `assets/img/favicon.svg` – "MH" monogram favicon
- `start-site.ps1` – starts the local site
- `stop-site.ps1` – stops the local site
- `status-site.ps1` – checks site status
- `open-site.ps1` – opens the site in the browser
- `README.md` – project overview and command usage
- `docs/PROJECT_GUIDE.md` – operational guide
- `PROJECT_MEMORY.md` – project history and decisions

## Completed work today
- Started local website using a Python HTTP server on port 8000.
- Connected and opened the site in the browser successfully at `http://localhost:8000`.
- Copied the resume PDF and personal photo into the project under `media/`.
- Extracted core resume information and tailored the site content to the actual profile.
- Replaced placeholder personal details with Mahmoud Hawa’s real professional identity.
- Updated site messaging to reflect:
  - enterprise technology executive focus
  - application portfolio management
  - digital transformation leadership
  - BI and analytics strategy
  - Saudi market and Vision 2030 alignment
- Added a real image section using the personal photo.
- Added PowerShell scripts to start, stop, check status, and open the site.
- Created VS Code tasks for the same actions.
- Added project folder structure for future work: `docs/`, `lib/`, `hooks/`, and `scripts/`.

## Media files
- `media/Mahmoud Hawa CV.pdf` – current resume copy
- `media/Personal Photo.jpg` – personal profile photo

## Resume-based content highlights used
- Name: Mahmoud Hawa
- Role: Enterprise Technology Executive | Application Portfolio Management | Digital Transformation
- Location: Riyadh, Saudi Arabia
- Email: mahmoud.hawa91@gmail.com
- LinkedIn: linkedin.com/in/hawamahmoud
- Experience: 12+ years across enterprise apps, digital transformation, ERP, BI, and process automation
- Current role: Business Applications & BI Manager at AL-AYUNI Investment & Contracting Company
- Prior roles: Business Intelligence Section Head and BI Specialist at Unicharm Gulf Hygienic Industries
- Education: Master’s in Entrepreneurship, Bachelor’s in Computer Information Systems
- Certifications: PMP, ITIL v4, PBA, KPI Professional

## Local run commands
From the project root:

```powershell
./start-site.ps1
./status-site.ps1
./open-site.ps1
./stop-site.ps1
```

## Project status
The site is currently configured as a lightweight static HTML/CSS portfolio and is ready for further enhancement.

## Future enhancements
- add project portfolio case studies
- add contact form or social integrations
- add behavior hooks under `hooks/` if the project grows
- expand into more advanced portfolio sections or analytics features
- replace the relative `og:image`/photo path with an absolute URL once a real
  domain exists (required for LinkedIn/social link previews to render)
- design a proper OG share-banner image (current one reuses the profile photo
  as a placeholder)

## Maintenance rules
- Preserve a clean separation between content, styling, and behavior.
- **All text/data content changes go in `content.md`, never hardcoded into
  `index.html`.**
- Keep all media under `media/`.
- Document architecture and assumptions in `docs/` or this file.
- Prefer simple static files unless a clear need for libraries or tooling appears.
- Keep the resume and media current when major updates happen.
- The site must be served over http(s) to work — `fetch('content.md')` fails
  silently under `file://`. Always use `start-site.ps1` / a real static host,
  never double-click `index.html`.

## Bilingual + theme architecture (added 2026-09-03)
- Added a full Arabic version (`ar/content.md`, same schema/syntax as
  `content.md` — structural markers like `## Hero`/`### Skills` stay in
  English as internal keys, only visible text is translated) plus an AR/EN
  toggle button in the nav. Switching language re-fetches the matching
  content file and re-renders the whole page, sets `document.documentElement`
  `lang`/`dir` (`dir="rtl"` for Arabic) so layout mirrors correctly (grid/flex
  handle most of this natively; `.back-to-top` and `.status-card` have
  explicit `[dir="rtl"]` position overrides since they use physical
  left/right). Arabic type uses the Tajawal webfont; Latin text (name,
  product/system names like Power BI, SAP, XCore, Logistic Link) stays
  untranslated per Mahmoud's stated preference (see CLAUDE.md language rule).
- Added `lib/i18n.js`: a dictionary of every UI "chrome" string (nav labels,
  hero buttons, section eyebrows, footer heading, control button labels) in
  en/ar, keyed by dot-path, with a `t(key, lang)` helper. This is separate
  from `content.md` — content.md holds resume/profile content, i18n.js holds
  structural page furniture.
- Added a light/dark theme toggle: CSS custom properties in `:root` (dark,
  default) and `:root[data-theme="light"]` (override) drive every color in
  the stylesheet — required converting several previously-hardcoded rgba()
  values (card backgrounds, header backdrop, tag/icon tints) into themed
  variables (`--surface-tint`, `--overlay`, `--accent-tint`, etc.) so they'd
  actually respond to the toggle.
- Both language and theme choices persist via `localStorage` (`site-lang`,
  `site-theme`) and are applied by a small synchronous inline script in
  `index.html`'s `<head>`, before first paint, to avoid a flash of the wrong
  theme/language on load.
- Validated the Arabic parser output and the i18n dictionary completeness in
  Node (same method as the English content validation) — no browser available
  in this environment, so a real visual check of RTL layout, Arabic text
  wrapping in cards, and the theme toggle is still recommended before
  publishing.

## Content accuracy & polish fixes (2026-09-03, continued)
- Fixed a translation risk in `ar/content.md`: company/university names
  (AL-AYUNI Investment & Contracting Company, Unicharm Gulf Hygienic
  Industries, Arrow Food Company, Midocean University, Zaytoonah Private
  University) had been guessed at as Arabic transliterations. Reverted all of
  them to their exact Latin spelling — same treatment already used for
  product names (Power BI, SAP, XCore, Logistic Link). **Rule going forward:
  never invent a transliteration for a company/institution name** — keep it
  in Latin script, or ask Mahmoud for the correct spelling if one is needed.
- Corrected the Entrepreneurship section's investment entry (both languages).
  It was originally written as a personal U.S.-equities investment practice
  (based on the older CLAUDE.md investment note), but the intended activity
  is **angel investing** — backing early-stage startups across multiple
  industries (services, entertainment, and others), contributing capital
  *and* hands-on technology/BI/operations expertise to portfolio companies.
  Arabic term confirmed by Mahmoud as "مستثمر ملائكي" (not the initially used
  "مستثمر ملاك").
- Fixed a bidi (bidirectional text) rendering bug: the phone number and email
  render inside RTL (Arabic) page flow, and Unicode's bidi algorithm can
  visually reorder space-separated digit groups and neutral characters like
  "+" — so a space-separated phone number could render with segments out of order in
  Arabic mode even though the underlying text is identical to English. Fixed
  by wrapping both in `<bdi dir="ltr">` inside `renderFooter()` in
  `lib/content-loader.js`, which forces correct left-to-right rendering
  regardless of surrounding RTL context.
- Replaced the plain-text nav brand ("Mahmoud Hawa") with a generated "MH"
  monogram logo (gradient badge using the site's accent colors, themed so it
  adapts to light/dark mode; same mark in both languages since a logo isn't
  translated). The name is preserved as a visually-hidden (`.sr-only`) label
  on the same link for accessibility/SEO — `content-loader.js` now updates
  that hidden span (`#nav-brand-name`) on render instead of overwriting the
  whole brand link's content, which would have deleted the logo SVG.

## Content architecture (added 2026-09-03)
- Site content lives in `content.md`, a structured-but-plain-Markdown file
  (frontmatter block + `##`/`###` headings + bullet lists), parsed at runtime
  by `lib/content-loader.js` (vanilla JS, no build step, no dependencies).
- Rewrote the audit-flagged bugs at the same time: `.profile-photo` had no CSS
  rule (photo was rendering unstyled/unconstrained) — fixed with a proper
  circular `object-fit: cover` treatment; removed dead `.avatar` CSS and the
  inert click-only nav-active JS (replaced with a working `IntersectionObserver`
  scroll-spy in `assets/js/main.js`); added a favicon (`assets/img/favicon.svg`,
  auto-generated "MH" monogram) and Open Graph/Twitter meta tags (image
  currently points at the profile photo as a placeholder — swap for a designed
  banner and an absolute URL once deployed); added a "Download CV" button
  wired to the existing resume PDF in `media/`.
- Added a new "Entrepreneurship & Investment" section (Logistic Link
  founder/CEO role, personal investment practice) — kept intentionally
  high-level per Mahmoud's choice: no dollar figures or platform names on the
  public site.
- Verified the parser against the real `content.md` in Node (all 9 sections,
  all entries, all icon references, no undefined fields) since there's no
  browser/screenshot tool available in this environment — a real visual check
  in an actual browser is still recommended before publishing.

## Automated backups
- A SessionStart hook (`.claude/settings.json`) runs `scripts/backup.ps1` every time a Claude Code session starts in this project.
- Each run copies the whole project into `D:\AI\personal-website-backups\<yyyyMMdd_HHmmss>\` (excluding `.git` and `.claude`).
- Only the most recent 20 backups are kept; older ones are pruned automatically.
- To roll back: copy the desired timestamped folder's contents back over the project.

## CV refresh, mobile redesign and security hardening (2026-11-14)
- **Content** (`content.md`, `ar/content.md`) re-aligned to the updated CV:
  new headline ("Enterprise Applications & Digital Transformation Leader |
  ERP | IT Governance | BI & Analytics | AI Adoption"), new summary, full
  experience bullets, Unicharm shown as ONE role (Business Intelligence
  Section Head, Nov 2018 — Oct 2024; the separate "BI Specialist" entry was
  removed to match the CV), company descriptors (`note` attribute), degree
  years, the five training items with provider and date, and a new Volunteer
  card. The credentials card is titled "Certifications & Professional
  Training" and each item says "Training", exactly as the CV words it.
- **Downloadable CV** is now `media/Mahmoud Hawa CV.pdf` (the old `Mahmoud
  Hawa Business Application.pdf` was removed). The original updated PDF was
  never available as a file in the session, so this PDF was REBUILT from its
  exact text and layout (HTML printed to PDF, Letter size, 2 pages). To use
  the original file instead, overwrite it in `media/` under the same name.
- **Mobile UI**: compact sticky header with a menu button (slide-down panel,
  closes on link tap / Escape / outside tap), profile-style centered hero,
  focus-area chips (from the `tagline` parts after the first "|"), stats moved
  directly under the hero as a 2-column card grid, icon-left service cards,
  experience cards that show 3 bullets with a "Show more" fold, 44px+ tap
  targets, safe-area insets, reduced-motion support, soft scroll reveal.
  Previously missing styles (`.skill-grid`, `.edu-grid`, `.contact-links`,
  timeline bullets) now exist. RTL uses CSS logical properties.
- **Security**: all content values are HTML-escaped and links scheme-checked
  in `lib/content-loader.js`; strict CSP meta tag (no inline scripts/styles —
  the pre-paint theme/language script moved to `assets/js/boot.js`);
  localStorage values validated against an allow-list; error banner no longer
  injects HTML; workflow actions pinned to commit SHAs with least-privilege
  job permissions; the deploy publishes an allow-list of site files only (the
  whole repo, including this file and the scripts, used to be served from the
  website); `/staging/` gets `noindex`; "Enforce HTTPS" turned on in the
  GitHub Pages settings.
- Verified in a real browser at 390px and desktop widths, both languages and
  both themes, with no CSP violations.
