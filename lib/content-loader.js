// Fetches content.md (or ar/content.md), parses its structured Markdown into
// data, and renders every section of the page from it. See the comment block
// at the top of content.md for the syntax this parser understands.
//
// Also owns the language switch (English <-> Arabic, RTL-aware) and the
// light/dark theme toggle. UI "chrome" strings (nav labels, buttons,
// eyebrows) come from lib/i18n.js; resume/profile content comes from the
// content.md files.

import { t, getStoredLang, setStoredLang, getStoredTheme, setStoredTheme } from './i18n.js';

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
};

const THEME_ICONS = {
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v3M12 18.5v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2.5 12h3M18.5 12h3M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/>',
};

const NAV_MAP = [
  ['#about', 'nav.about'],
  ['#services', 'nav.services'],
  ['#projects', 'nav.achievements'],
  ['#experience', 'nav.experience'],
  ['#entrepreneurship', 'nav.ventures'],
  ['#education', 'nav.education'],
  ['#contact', 'nav.contact'],
];

const CONTENT_PATH = { en: 'content.md', ar: 'ar/content.md' };

function iconSvg(name) {
  const paths = ICONS[name] || ICONS.layers;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

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

function parseContent(raw) {
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

function renderHero(meta, hero, lang) {
  const intro = hero ? hero.paragraphs.join(' ') : '';
  return `
    <div class="hero-copy">
      <p class="eyebrow">${t('hero.greeting', lang)}</p>
      <h1>${meta.name || ''}</h1>
      <h2>${meta.tagline || ''}</h2>
      <p>${intro}</p>
      <div class="hero-actions">
        <a class="button primary" href="#experience">${t('hero.ctaExperience', lang)}</a>
        <a class="button secondary" href="#contact">${t('hero.ctaContact', lang)}</a>
        ${meta.resume ? `<a class="button secondary" href="${meta.resume}" download>${t('hero.ctaResume', lang)}</a>` : ''}
      </div>
      <ul class="socials">
        <li><a href="${meta.linkedin_url || '#'}" target="_blank" rel="noopener noreferrer">${t('hero.linkedin', lang)}</a></li>
        <li><a href="mailto:${meta.email || ''}">${t('hero.email', lang)}</a></li>
        <li><a href="tel:${meta.phone_href || ''}">${t('hero.phone', lang)}</a></li>
      </ul>
    </div>
    <div class="hero-visual">
      <div class="profile-card">
        <img src="${meta.photo || ''}" alt="${meta.name || ''}" class="profile-photo" width="420" height="420" />
        <div class="status-card">
          <span>${t('hero.basedIn', lang)} ${meta.location || ''}</span>
          <strong>${t('hero.visionTag', lang)}</strong>
        </div>
      </div>
    </div>
  `;
}

function renderStats(stats) {
  if (!stats) return '';
  const tiles = stats.bullets
    .map((s) => `<div class="stat-tile"><strong>${s.value}</strong><span>${s.label}</span></div>`)
    .join('');
  return `<div class="stats-grid">${tiles}</div>`;
}

function renderAbout(about, lang) {
  if (!about) return '';
  const skillsEntry = about.entries.find((e) => e.title.toLowerCase() === 'skills');
  const skills = skillsEntry ? skillsEntry.bullets : [];
  const paras = about.paragraphs.map((p) => `<p>${p}</p>`).join('');
  return `
    <div class="section-heading">
      <p class="eyebrow">${t('eyebrows.about', lang)}</p>
      <h3>${about.attrs.heading || t('eyebrows.about', lang)}</h3>
    </div>
    <div class="about-grid">${paras}</div>
    <div class="skill-grid">${skills.map((s) => `<span>${s}</span>`).join('')}</div>
  `;
}

function renderServices(services, lang) {
  if (!services) return '';
  const cards = services.entries
    .map(
      (e) => `
      <article class="service-card">
        <span class="service-icon" aria-hidden="true">${iconSvg(e.attrs.icon)}</span>
        <h4>${e.title}</h4>
        <p>${e.paragraphs.join(' ')}</p>
      </article>`
    )
    .join('');
  return `
    <div class="section-heading">
      <p class="eyebrow">${t('eyebrows.services', lang)}</p>
      <h3>${services.attrs.heading || t('eyebrows.services', lang)}</h3>
    </div>
    <div class="services-grid">${cards}</div>
  `;
}

function renderAchievements(achievements, lang) {
  if (!achievements) return '';
  const cards = achievements.entries
    .map(
      (e) => `
      <article class="project-card">
        <span class="tag">${e.attrs.tag || ''}</span>
        <h4>${e.title}</h4>
        <p>${e.paragraphs.join(' ')}</p>
      </article>`
    )
    .join('');
  return `
    <div class="section-heading">
      <p class="eyebrow">${t('eyebrows.achievements', lang)}</p>
      <h3>${achievements.attrs.heading || t('eyebrows.achievements', lang)}</h3>
    </div>
    <div class="card-grid">${cards}</div>
  `;
}

function renderExperience(experience, lang) {
  if (!experience) return '';
  const items = experience.entries
    .map(
      (e) => `
      <div class="timeline-item">
        <span class="year">${e.attrs.dates || ''}</span>
        <div>
          <h4>${e.title}</h4>
          <p>${e.attrs.company || ''}</p>
          <ul>${e.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
        </div>
      </div>`
    )
    .join('');
  return `
    <div class="section-heading">
      <p class="eyebrow">${t('eyebrows.experience', lang)}</p>
      <h3>${experience.attrs.heading || t('eyebrows.experience', lang)}</h3>
    </div>
    <div class="timeline">${items}</div>
  `;
}

function renderEntrepreneurship(section, lang) {
  if (!section) return '';
  const cards = section.entries
    .map(
      (e) => `
      <article class="service-card">
        <span class="service-icon" aria-hidden="true">${iconSvg(e.attrs.icon)}</span>
        <h4>${e.title}</h4>
        <p>${e.paragraphs.join(' ')}</p>
      </article>`
    )
    .join('');
  return `
    <div class="section-heading">
      <p class="eyebrow">${t('eyebrows.ventures', lang)}</p>
      <h3>${section.attrs.heading || t('eyebrows.ventures', lang)}</h3>
    </div>
    <div class="services-grid entrepreneurship-grid">${cards}</div>
  `;
}

function renderEducation(education, certifications, lang) {
  if (!education) return '';
  const eduCards = education.entries
    .map(
      (e) => `
      <div>
        <h4>${e.title}</h4>
        <p>${e.attrs.school || ''}</p>
        ${e.paragraphs.length ? `<small>${e.paragraphs.join(' ')}</small>` : ''}
      </div>`
    )
    .join('');
  const certCard = certifications
    ? `<div><h4>${t('education.certifications', lang)}</h4><p>${certifications.bullets.join(' &bull; ')}</p></div>`
    : '';
  return `
    <div class="section-heading">
      <p class="eyebrow">${t('eyebrows.education', lang)}</p>
      <h3>${education.attrs.heading || t('eyebrows.education', lang)}</h3>
    </div>
    <div class="edu-grid">${eduCards}${certCard}</div>
  `;
}

function renderFooter(meta, lang) {
  return `
    <div>
      <p class="eyebrow">${t('eyebrows.contact', lang)}</p>
      <h3>${t('footer.heading', lang)}</h3>
    </div>
    <div class="contact-links">
      <a href="mailto:${meta.email || ''}" class="button primary"><bdi dir="ltr">${meta.email || ''}</bdi></a>
      <a href="tel:${meta.phone_href || ''}" class="button secondary"><bdi dir="ltr">${meta.phone || ''}</bdi></a>
    </div>
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

async function renderSite(lang) {
  const res = await fetch(CONTENT_PATH[lang] || CONTENT_PATH.en, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${CONTENT_PATH[lang]} failed to load (HTTP ${res.status})`);
  const raw = await res.text();
  const { meta, sections } = parseContent(raw);

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.title = meta.title || meta.name || 'Mahmoud Hawa';
  setMeta('#meta-description', 'content', meta.description);
  setMeta('#og-title', 'content', meta.title || meta.name);
  setMeta('#og-description', 'content', meta.description);
  setMeta('#og-image', 'content', meta.photo);
  const brandName = document.getElementById('nav-brand-name');
  if (brandName) brandName.textContent = meta.name || '';

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
  mount('education-mount', renderEducation(sections.Education, sections.Certifications, lang));
  mount('footer-mount', renderFooter(meta, lang));

  updateNavLabels(lang);

  const backToTop = document.getElementById('back-to-top');
  if (backToTop) backToTop.setAttribute('aria-label', t('controls.backToTop', lang));

  document.dispatchEvent(new CustomEvent('content:rendered', { detail: { lang } }));
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const lang = document.documentElement.lang || 'en';
    themeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${
      theme === 'dark' ? THEME_ICONS.sun : THEME_ICONS.moon
    }</svg>`;
    // Label describes the action (what clicking does next), not the current state.
    themeBtn.setAttribute('aria-label', t(theme === 'dark' ? 'controls.themeToLight' : 'controls.themeToDark', lang));
  }
}

function setupControls(initialLang) {
  let currentLang = initialLang;

  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.textContent = t('controls.langToggleLabel', currentLang);
    langBtn.setAttribute('aria-label', t('controls.langToggleAria', currentLang));
    langBtn.addEventListener('click', async () => {
      currentLang = currentLang === 'en' ? 'ar' : 'en';
      setStoredLang(currentLang);
      langBtn.textContent = t('controls.langToggleLabel', currentLang);
      langBtn.setAttribute('aria-label', t('controls.langToggleAria', currentLang));
      try {
        await renderSite(currentLang);
        const activeTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        applyTheme(activeTheme); // refresh theme-toggle's aria-label into the new language
      } catch (err) {
        showLoadError(err);
      }
    });
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

function showLoadError(err) {
  console.error('[content-loader]', err);
  document.body.insertAdjacentHTML(
    'afterbegin',
    `<div style="background:#7f1d1d;color:#fff;padding:0.9rem 1rem;text-align:center;font:600 0.9rem/1.4 sans-serif;">
      Site content failed to load (${err.message}). This page must be served over http(s) — opening index.html
      directly from disk (file://) will not work. Run start-site.ps1 and open http://localhost:8000.
    </div>`
  );
}

const initialTheme = getStoredTheme();
applyTheme(initialTheme);

const initialLang = getStoredLang();
setupControls(initialLang);
renderSite(initialLang).catch(showLoadError);
