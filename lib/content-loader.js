// Fetches content.md (or ar/content.md), parses its structured Markdown into
// data, and renders every section of the page from it. See the comment block
// at the top of content.md for the syntax this parser understands.
//
// Also owns the language switch (English <-> Arabic, RTL-aware), the
// light/dark theme toggle, and the mobile menu. UI "chrome" strings (nav
// labels, buttons, eyebrows) come from lib/i18n.js; resume/profile content
// comes from the content.md files.
//
// SECURITY: every value that originates in a content file is passed through
// esc() before it is placed in HTML, and every link through safeUrl(). The
// page also ships a strict Content-Security-Policy (see index.html) that
// forbids inline scripts and inline styles — so never add `style="..."` or
// `on*="..."` attributes to the markup generated here; use a CSS class.

import { t, getStoredTheme, setStoredTheme } from './i18n.js';
import { bookingAnchor } from './booking.js';

const ICONS = {
  layers: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 5-5 2 2-5z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
  chart: '<path d="M4 19V10M10 19V5M16 19v-7M4 19h16"/>',
  link: '<path d="M9 15L15 9M8 4h4v4M20 8v4h-4M4 16v4h4M16 20h4v-4"/>',
  workflow: '<circle cx="7" cy="6" r="2.2"/><circle cx="17" cy="6" r="2.2"/><circle cx="12" cy="17" r="2.2"/><path d="M7 8.2V12M17 8.2V12M9 15l1.5-1.7M15 15l-1.5-1.7"/>',
  contract: '<path d="M4 6h11M4 12h16M4 18h9"/><circle cx="19" cy="6" r="2"/><circle cx="7" cy="18" r="2"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  rocket: '<path d="M12 2c2.5 2 4 5 4 8.5 0 1.8-.5 3.3-1.2 4.5H9.2C8.5 13.8 8 12.3 8 10.5 8 7 9.5 4 12 2z"/><circle cx="12" cy="9" r="1.6"/><path d="M8.5 15.5L6 20l3.5-1.3M15.5 15.5L18 20l-3.5-1.3"/>',
  trending: '<path d="M4 17l6-6 4 4 6-8"/><path d="M15 6h5v5"/>',
  // UI icons (not selectable from content.md)
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5V17M8 7.2v.1M12 17v-3.6a2.4 2.4 0 0 1 4.8 0V17M12 10.5V17"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
  download: '<path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 19.5h14"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
};

const THEME_ICONS = {
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v3M12 18.5v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2.5 12h3M18.5 12h3M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/>',
};

const THEME_COLORS = { dark: '#0b1020', light: '#f6f8fc' };

export const NAV_MAP = [
  ['#about', 'nav.about'],
  ['#how-we-work', 'nav.how'],
  ['#services', 'nav.services'],
  ['#experience', 'nav.experience'],
  ['#faq', 'nav.faq'],
  ['#contact', 'nav.contact'],
];

// Must stay in sync with the CSS hamburger breakpoint (max-width: 1100px).
export const NAV_BREAKPOINT_PX = 1100;

const CONTENT_PATH = { en: 'content.md', ar: 'ar/content.md' };

// How many experience bullets stay visible before the "Show more" fold.
const VISIBLE_BULLETS = 3;

/* ---------- output safety helpers ---------- */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escape a value for safe use in HTML text or a double-quoted attribute.
export function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}



/** Strip a leading "1. " / "٢- " prefix so the CSS step badge is the only number. */
export function visibleStepTitle(title) {
  return String(title || '')
    .replace(/^\s*(?:\d+|[\u0660-\u0669\u06F0-\u06F9]+)[.)\]\-:：．]\s+/u, '')
    .trim();
}
// Only allow http(s), mailto, tel, and same-site relative links. Anything
// else (javascript:, data:, vbscript:, ...) collapses to a harmless "#".
function safeUrl(value) {
  const url = String(value == null ? '' : value).trim();
  if (!url) return '#';
  const scheme = url.match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme) {
    return /^(https?|mailto|tel)$/i.test(scheme[1]) ? esc(url) : '#';
  }
  if (url.startsWith('//')) return '#'; // protocol-relative -> off-site
  return esc(encodeURI(url));
}

// A bullet is a plain string, or {value, label} when the line contained "|".
function bulletText(b) {
  return typeof b === 'string' ? b : `${b.value} | ${b.label}`;
}

function iconSvg(name) {
  const paths = ICONS[name] || ICONS.layers;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

/* ---------- parsing ---------- */

function stripQuotes(val) {
  const v = val.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseAttrs(str) {
  const attrs = {};
  if (!str) return attrs;
  const re = /(\w+)\s*:\s*(".*?"|'.*?'|[^,]+)/g;
  let m;
  while ((m = re.exec(str))) {
    attrs[m[1]] = stripQuotes(m[2]);
  }
  return attrs;
}

export function parseContent(raw) {
  const fmMatch = raw.match(/---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const meta = {};
  let body = raw;
  if (fmMatch) {
    fmMatch[1].split(/\r?\n/).forEach((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const val = stripQuotes(line.slice(idx + 1));
      if (key) meta[key] = val;
    });
    body = fmMatch[2];
  }

  const sections = {};
  let currentSection = null;
  let currentEntry = null;
  let paraBuffer = [];

  const target = () => currentEntry || currentSection;
  const flushPara = () => {
    if (paraBuffer.length && currentSection) {
      target().paragraphs.push(paraBuffer.join(' '));
    }
    paraBuffer = [];
  };

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    const h2 = line.match(/^##\s+([^{]+?)\s*(\{(.*)\})?\s*$/);
    const h3 = line.match(/^###\s+([^{]+?)\s*(\{(.*)\})?\s*$/);
    const bullet = line.match(/^-\s+(.*)$/);

    if (h2) {
      flushPara();
      currentSection = { name: h2[1].trim(), attrs: parseAttrs(h2[3]), paragraphs: [], bullets: [], entries: [] };
      sections[currentSection.name] = currentSection;
      currentEntry = null;
      continue;
    }
    if (!currentSection) continue;

    if (h3) {
      flushPara();
      currentEntry = { title: h3[1].trim(), attrs: parseAttrs(h3[3]), paragraphs: [], bullets: [] };
      currentSection.entries.push(currentEntry);
      continue;
    }
    if (bullet) {
      flushPara();
      const text = bullet[1].trim();
      const statMatch = text.match(/^(.+?)\s*\|\s*(.+)$/);
      target().bullets.push(statMatch ? { value: statMatch[1].trim(), label: statMatch[2].trim() } : text);
      continue;
    }
    if (line === '') {
      flushPara();
      continue;
    }
    paraBuffer.push(line);
  }
  flushPara();

  return { meta, sections };
}

/* ---------- rendering ---------- */

function sectionHeading(eyebrowKey, heading, lang) {
  return `
    <div class="section-heading">
      <p class="eyebrow">${esc(t(eyebrowKey, lang))}</p>
      <h2>${esc(heading || t(eyebrowKey, lang))}</h2>
    </div>`;
}

function srcsetAttr(value) {
  return String(value || '')
    .split(',')
    .map((part) => {
      const bits = part.trim().split(/\s+/);
      if (!bits[0]) return '';
      return bits[1] ? `${safeUrl(bits[0])} ${bits[1]}` : safeUrl(bits[0]);
    })
    .filter(Boolean)
    .join(', ');
}

function renderPhoto(meta) {
  const alt = esc(meta.name);
  const webp = meta.photo || '';
  const fallback = meta.photo_fallback || webp;
  const srcset = srcsetAttr(meta.photo_srcset);
  const source = srcset
    ? `<source type="image/webp" srcset="${srcset}" sizes="(max-width: 860px) 148px, 312px" />`
    : '';
  return `<picture>${source}<img src="${safeUrl(source ? fallback : webp)}" alt="${alt}" class="profile-photo" width="420" height="420" decoding="async" fetchpriority="high" /></picture>`;
}

function renderHero(meta, hero, lang) {
  const intro = hero ? hero.paragraphs.join(' ') : '';
  const parts = String(meta.tagline || '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  const role = meta.h1 ? '' : parts[0] || '';
  const focus = meta.h1 ? parts : parts.slice(1);
  const focusChips = focus.length
    ? `<ul class="focus-chips">${focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
    : '';
  const headline = meta.h1 || meta.name;
  const eyebrow = meta.eyebrow || t('hero.greeting', lang);
  return `
    <div class="hero-visual">
      <div class="profile-card">
        ${renderPhoto(meta)}
      </div>
    </div>
    <div class="hero-copy">
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1 class="${meta.h1 ? 'service-title' : ''}">${esc(headline)}</h1>
      ${role ? `<h2>${esc(role)}</h2>` : ''}
      ${focusChips}
      <p class="hero-intro">${esc(intro)}</p>
      <div class="hero-actions">
        ${bookingAnchor('button primary', esc(t('hero.ctaPrimary', lang)))}
        <a class="button secondary" href="#how-we-work">${esc(t('hero.ctaSecondary', lang))}</a>
        ${
          meta.resume
            ? `<a class="button secondary" href="${safeUrl(meta.resume)}" download>${iconSvg('download')}<span>${esc(t('hero.ctaResume', lang))}</span></a>`
            : ''
        }
      </div>
      <ul class="socials">
        <li><a href="${safeUrl(meta.linkedin_url)}" target="_blank" rel="noopener noreferrer">${iconSvg('linkedin')}<span>${esc(t('hero.linkedin', lang))}</span></a></li>
        <li><a href="${safeUrl('mailto:' + (meta.email || ''))}">${iconSvg('mail')}<span>${esc(t('hero.email', lang))}</span></a></li>
      </ul>
    </div>
  `;
}

function renderStats(stats) {
  if (!stats) return '';
  const tiles = stats.bullets
    .filter((s) => typeof s !== 'string')
    .map((s) => `<div class="stat-tile"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`)
    .join('');
  return `<div class="stats-grid">${tiles}</div>`;
}

function renderAbout(about, lang) {
  if (!about) return '';
  const skillsEntry = about.entries.find((e) => e.title.toLowerCase() === 'skills');
  const skills = skillsEntry ? skillsEntry.bullets : [];
  const paras = about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
  return `
    ${sectionHeading('eyebrows.about', about.attrs.heading, lang)}
    <div class="about-grid">${paras}</div>
    <ul class="skill-grid">${skills.map((s) => `<li>${esc(bulletText(s))}</li>`).join('')}</ul>
  `;
}

function iconCards(entries, lang, withMore) {
  return entries
    .map((e) => {
      const more = withMore && e.attrs.href
        ? `<a class="text-link" href="${safeUrl(e.attrs.href)}">${esc(t('services.more', lang))} ${esc(e.title)}</a>`
        : '';
      const links = more ? `<p class="service-links">${more}</p>` : '';
      return `
      <article class="service-card">
        <span class="service-icon" aria-hidden="true">${iconSvg(e.attrs.icon)}</span>
        <div class="service-body">
          <h3>${esc(e.title)}</h3>
          <p>${esc(e.paragraphs.join(' '))}</p>
          ${links}
        </div>
      </article>`;
    })
    .join('');
}

function renderServices(services, lang) {
  if (!services) return '';
  return `
    ${sectionHeading('eyebrows.services', services.attrs.heading, lang)}
    <div class="services-grid">${iconCards(services.entries, lang, true)}</div>
    <div class="services-cta">${bookingAnchor('button primary', esc(t('hero.ctaPrimary', lang)))}</div>
  `;
}

function renderAchievements(achievements, lang) {
  if (!achievements) return '';
  const cards = achievements.entries
    .map(
      (e) => `
      <article class="project-card">
        ${e.attrs.tag ? `<span class="tag">${esc(e.attrs.tag)}</span>` : ''}
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.paragraphs.join(' '))}</p>
      </article>`
    )
    .join('');
  return `
    ${sectionHeading('eyebrows.achievements', achievements.attrs.heading, lang)}
    <div class="card-grid">${cards}</div>
  `;
}

function renderExperience(experience, lang) {
  if (!experience) return '';
  const items = experience.entries
    .map((e) => {
      const bullets = e.bullets
        .map((b, i) => `<li${i >= VISIBLE_BULLETS ? ' class="extra"' : ''}>${esc(bulletText(b))}</li>`)
        .join('');
      const hidden = Math.max(0, e.bullets.length - VISIBLE_BULLETS);
      const toggle = hidden
        ? `<button class="more-toggle" type="button" aria-expanded="false">
             <span class="more-label">${esc(t('experience.showMore', lang))} (${hidden})</span>${iconSvg('chevron')}
           </button>`
        : '';
      return `
      <article class="timeline-item">
        <span class="year">${esc(e.attrs.dates)}</span>
        <div class="timeline-body">
          <h3>${esc(e.title)}</h3>
          <p class="company">${esc(e.attrs.company)}</p>
          ${e.attrs.note ? `<p class="company-note">${esc(e.attrs.note)}</p>` : ''}
          <ul class="highlights">${bullets}</ul>
          ${toggle}
        </div>
      </article>`;
    })
    .join('');
  return `
    ${sectionHeading('eyebrows.experience', experience.attrs.heading, lang)}
    <div class="timeline">${items}</div>
  `;
}

function renderEntrepreneurship(section, lang) {
  if (!section) return '';
  return `
    ${sectionHeading('eyebrows.ventures', section.attrs.heading, lang)}
    <div class="services-grid entrepreneurship-grid">${iconCards(section.entries, lang, false)}</div>
  `;
}

function renderEducation(education, certifications, volunteer, lang) {
  if (!education) return '';
  const eduCards = education.entries
    .map(
      (e) => `
      <article class="edu-card">
        ${e.attrs.year ? `<span class="tag">${esc(e.attrs.year)}</span>` : ''}
        <h3>${esc(e.title)}</h3>
        <p class="company">${esc(e.attrs.school)}</p>
        ${e.paragraphs.length ? `<p class="edu-note">${esc(e.paragraphs.join(' '))}</p>` : ''}
      </article>`
    )
    .join('');
  const certCard =
    certifications && certifications.bullets.length
      ? `<article class="edu-card edu-card-wide">
           <h3>${esc(t('education.certifications', lang))}</h3>
           <ul class="cert-list">${certifications.bullets
             .map((c) =>
               typeof c === 'string'
                 ? `<li><strong>${esc(c)}</strong></li>`
                 : `<li><strong>${esc(c.value)}</strong><span>${esc(c.label)}</span></li>`
             )
             .join('')}</ul>
         </article>`
      : '';
  const volunteerCard =
    volunteer && volunteer.paragraphs.length
      ? `<article class="edu-card edu-card-wide">
           <h3>${esc(t('education.volunteer', lang))}</h3>
           <p class="edu-note">${esc(volunteer.paragraphs.join(' '))}</p>
         </article>`
      : '';
  return `
    ${sectionHeading('eyebrows.education', education.attrs.heading, lang)}
    <div class="edu-grid">${eduCards}${certCard}${volunteerCard}</div>
  `;
}

function renderDefinitions(section, lang) {
  if (!section) return '';
  const items = section.entries
    .map(
      (e) => `
      <article class="definition">
        <h3>${esc(e.title)}</h3>
        ${e.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
      </article>`
    )
    .join('');
  return `
    ${sectionHeading('eyebrows.definition', section.attrs.heading, lang)}
    <div class="definition-list">${items}</div>`;
}

function renderHow(section, lang) {
  if (!section) return '';
  const steps = section.entries
    .map(
      (e) => `
      <li>
        <h3>${esc(visibleStepTitle(e.title))}</h3>
        <p>${esc(e.paragraphs.join(' '))}</p>
      </li>`
    )
    .join('');
  return `
    ${sectionHeading('eyebrows.how', section.attrs.heading, lang)}
    <ol class="steps">${steps}</ol>`;
}

function renderFaq(section, lang) {
  if (!section) return '';
  const items = section.entries
    .map((e) => {
      const paras = e.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
      const bullets = e.bullets.length
        ? `<ul>${e.bullets.map((b) => `<li>${esc(bulletText(b))}</li>`).join('')}</ul>`
        : '';
      return `<article class="faq-item"><h3>${esc(e.title)}</h3>${paras}${bullets}</article>`;
    })
    .join('');
  return `
    ${sectionHeading('eyebrows.faq', section.attrs.heading, lang)}
    <div class="faq-list">${items}</div>`;
}

export function renderArticle(meta, sections, lang) {
  const blocks = Object.values(sections)
    .map((section) => {
      const heading = section.attrs.heading || section.name;
      const paras = section.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
      const bullets = section.bullets.length
        ? `<ul>${section.bullets.map((b) => `<li>${esc(bulletText(b))}</li>`).join('')}</ul>`
        : '';
      const entries = section.entries
        .map((e) => {
          const ep = e.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
          const eb = e.bullets.length
            ? `<ul>${e.bullets.map((b) => `<li>${esc(bulletText(b))}</li>`).join('')}</ul>`
            : '';
          return `<h3>${esc(e.title)}</h3>${ep}${eb}`;
        })
        .join('');
      return `<section class="service-block"><h2>${esc(heading)}</h2>${paras}${bullets}${entries}</section>`;
    })
    .join('');
  return `<article class="service-page container">
    <p class="eyebrow">${esc(meta.eyebrow || '')}</p>
    <h1>${esc(meta.h1 || meta.title || '')}</h1>
    ${blocks}
    <div class="service-cta">${bookingAnchor('button primary', esc(t('hero.ctaPrimary', lang)))}</div>
  </article>`;
}

export function renderFooter(meta, contact, lang) {
  const heading = (contact && contact.attrs.heading) || t('footer.heading', lang);
  const note = contact ? contact.paragraphs.map((p) => `<p class="footer-note">${esc(p)}</p>`).join('') : '';
  return `
    <div class="footer-copy">
      <p class="eyebrow">${esc(t('eyebrows.contact', lang))}</p>
      <h2 class="footer-heading">${esc(heading)}</h2>
      ${note}
      ${bookingAnchor('button primary footer-cta', esc(t('hero.ctaPrimary', lang)))}
      <p class="footer-location">${iconSvg('pin')}<span>${esc(meta.location)}</span></p>
    </div>
    <div class="contact-links">
      <a href="${safeUrl('mailto:' + (meta.email || ''))}" class="button primary">${iconSvg('mail')}<bdi dir="ltr">${esc(meta.email)}</bdi></a>
      <a href="${safeUrl(meta.linkedin_url)}" class="button secondary" target="_blank" rel="noopener noreferrer">${iconSvg('linkedin')}<span>${esc(t('hero.linkedin', lang))}</span></a>
    </div>
    <p class="footer-legal">&copy; ${new Date().getFullYear()} <bdi>${esc(meta.name)}</bdi></p>
  `;
}

function setMeta(selector, attr, value) {
  const node = document.querySelector(selector);
  if (node) node.setAttribute(attr, value || '');
}

function updateNavLabels(lang) {
  NAV_MAP.forEach(([href, key]) => {
    const el = document.querySelector(`.nav-links a[href="${href}"]`);
    if (el) el.textContent = t(key, lang);
  });
}

function applyChromeLabels(lang, name) {
  const skip = document.querySelector('.skip-link');
  if (skip) skip.textContent = t('controls.skip', lang);
  const nav = document.querySelector('.nav');
  if (nav) nav.setAttribute('aria-label', t('controls.primaryNav', lang));
  const brandName = document.getElementById('nav-brand-name');
  if (brandName && name) brandName.textContent = name;
  const stats = document.querySelector('.stats-section');
  if (stats) stats.setAttribute('aria-label', t('controls.stats', lang));
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) backToTop.setAttribute('aria-label', t('controls.backToTop', lang));
}

function absoluteUrl(path) {
  try {
    return new URL(encodeURI(path || ''), document.baseURI).href;
  } catch (e) {
    return '';
  }
}

export function renderMounts(meta, sections, lang) {
  return {
    'hero-mount': renderHero(meta, sections.Hero, lang),
    'stats-mount': renderStats(sections.Stats),
    'definition-mount': renderDefinitions(sections.Definition, lang),
    'how-mount': renderHow(sections.How, lang),
    'about-mount': renderAbout(sections.About, lang),
    'services-mount': renderServices(sections.Services, lang),
    'faq-mount': renderFaq(sections.FAQ, lang),
    'achievements-mount': renderAchievements(sections.Achievements, lang),
    'experience-mount': renderExperience(sections.Experience, lang),
    'entrepreneurship-mount': renderEntrepreneurship(sections.Entrepreneurship, lang),
    'education-mount': renderEducation(sections.Education, sections.Certifications, sections.Volunteer, lang),
    'footer-mount': renderFooter(meta, sections.Contact, lang),
  };
}

async function renderSite(lang) {
  const explicit = document.querySelector('meta[name="mh-content"]');
  const path = (explicit && explicit.content) || CONTENT_PATH[lang] || CONTENT_PATH.en;
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} failed to load (HTTP ${res.status})`);
  const raw = await res.text();
  const { meta, sections } = parseContent(raw);

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.title = meta.title || meta.name || 'Mahmoud Hawa';
  const shareTitle = meta.og_title || meta.title || meta.name;
  const shareDescription = meta.og_description || meta.description;
  const shareImage = absoluteUrl(meta.og_image || meta.photo);
  setMeta('#meta-description', 'content', meta.description);
  setMeta('#og-title', 'content', shareTitle);
  setMeta('#og-description', 'content', shareDescription);
  setMeta('#og-image', 'content', shareImage);
  setMeta('#twitter-title', 'content', shareTitle);
  setMeta('#twitter-description', 'content', shareDescription);
  setMeta('#twitter-image', 'content', shareImage);
  setMeta('meta[property="og:locale"]', 'content', lang === 'ar' ? 'ar_SA' : 'en_US');

  const mount = (id, html) => {
    const node = document.getElementById(id);
    if (node) node.innerHTML = html;
  };

  mount('hero-mount', renderHero(meta, sections.Hero, lang));
  mount('stats-mount', renderStats(sections.Stats));
  mount('about-mount', renderAbout(sections.About, lang));
  mount('services-mount', renderServices(sections.Services, lang));
  mount('achievements-mount', renderAchievements(sections.Achievements, lang));
  mount('experience-mount', renderExperience(sections.Experience, lang));
  mount('entrepreneurship-mount', renderEntrepreneurship(sections.Entrepreneurship, lang));
  mount('education-mount', renderEducation(sections.Education, sections.Certifications, sections.Volunteer, lang));
  mount('definition-mount', renderDefinitions(sections.Definition, lang));
  mount('how-mount', renderHow(sections.How, lang));
  mount('faq-mount', renderFaq(sections.FAQ, lang));
  mount('footer-mount', renderFooter(meta, sections.Contact, lang));

  updateNavLabels(lang);
  applyChromeLabels(lang, meta.name);

  document.dispatchEvent(new CustomEvent('content:rendered', { detail: { lang } }));
}

/* ---------- controls: theme, language, mobile menu, "show more" ---------- */

function applyTheme(theme) {
  const safeTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', safeTheme);
  setMeta('#meta-theme-color', 'content', THEME_COLORS[safeTheme]);
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    themeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
      safeTheme === 'dark' ? THEME_ICONS.sun : THEME_ICONS.moon
    }</svg>`;
    // Label describes the action (what clicking does next), not the current state.
    themeBtn.setAttribute('aria-label', t(safeTheme === 'dark' ? 'controls.themeToLight' : 'controls.themeToDark', lang));
  }
}

function setupMenu(getLang) {
  const header = document.querySelector('.site-header');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!header || !toggle || !links) return { refresh() {} };

  const isOpen = () => header.classList.contains('nav-open');
  const refresh = () => {
    toggle.setAttribute('aria-expanded', String(isOpen()));
    toggle.setAttribute('aria-label', t(isOpen() ? 'controls.menuClose' : 'controls.menuOpen', getLang()));
  };
  const setOpen = (open) => {
    header.classList.toggle('nav-open', open);
    refresh();
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));
  // The links sit before the toggle in the DOM (desktop layout), so when the
  // mobile menu is open, Tab from the toggle must go into the menu links
  // instead of the page content behind it.
  toggle.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || event.shiftKey || !isOpen()) return;
    const first = links.querySelector('a');
    if (first) {
      event.preventDefault();
      first.focus();
    }
  });
  links.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (isOpen() && !header.contains(event.target)) setOpen(false);
  });
  // Leaving the mobile breakpoint with the menu open must not leave it stuck.
  window.addEventListener('resize', () => {
    if (isOpen() && window.matchMedia(`(min-width: ${NAV_BREAKPOINT_PX + 1}px)`).matches) setOpen(false);
  });

  refresh();
  return { refresh };
}

function setupShowMore(getLang) {
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.more-toggle');
    if (!btn) return;
    const item = btn.closest('.timeline-item');
    if (!item) return;
    const expanded = item.classList.toggle('expanded');
    btn.setAttribute('aria-expanded', String(expanded));
    const label = btn.querySelector('.more-label');
    if (label) {
      const hidden = item.querySelectorAll('li.extra').length;
      label.textContent = expanded
        ? t('experience.showLess', getLang())
        : `${t('experience.showMore', getLang())} (${hidden})`;
    }
  });
}

function setupControls(initialLang) {
  let currentLang = initialLang;
  const getLang = () => currentLang;

  setupMenu(getLang);
  setupShowMore(getLang);
  const brandName = document.getElementById('nav-brand-name');
  applyChromeLabels(currentLang, brandName ? brandName.textContent : '');

  const langBtn = document.getElementById('lang-toggle');
  if (langBtn && langBtn.tagName !== 'A') {
    langBtn.textContent = t('controls.langToggleLabel', currentLang);
    langBtn.setAttribute('aria-label', t('controls.langToggleAria', currentLang));
  }

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      setStoredTheme(next);
    });
  }
}

// Details go to the console only; the banner shows a fixed, translated
// message (set with textContent, never as HTML).
function showLoadError(err, lang) {
  console.error('[content-loader]', err);
  if (document.querySelector('.load-error')) return;
  const banner = document.createElement('div');
  banner.className = 'load-error';
  banner.setAttribute('role', 'alert');
  banner.textContent = t('controls.loadError', lang);
  document.body.prepend(banner);
}

if (typeof document !== 'undefined') {
  const initialTheme = getStoredTheme();
  applyTheme(initialTheme);

  // Language follows the URL (/ for English, /ar/ for Arabic), not localStorage.
  const initialLang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  setupControls(initialLang);

  const hero = document.getElementById('hero-mount');
  const staticPage = document.querySelector('meta[name="mh-static"]');
  if (staticPage || (hero && hero.children.length > 0)) {
    document.dispatchEvent(new CustomEvent('content:rendered', { detail: { lang: initialLang } }));
  } else {
    renderSite(initialLang).catch((err) => showLoadError(err, initialLang));
  }
}
