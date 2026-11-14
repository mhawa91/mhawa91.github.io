// Build-time prerender. content.md and ar/content.md stay the source of truth.
// This writes the same HTML the browser renderer would, so crawlers that do
// not run JavaScript still receive the full page. Run from the repo root:
//   node scripts/prerender.mjs .
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { parseContent, renderMounts, renderArticle, renderFooter, NAV_MAP, esc } from '../lib/content-loader.js';
import { t } from '../lib/i18n.js';

const SITE = 'https://mahmoudhawa.com';
const root = process.argv[2] || '.';

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function replaceMount(html, id, inner) {
  const openRe = new RegExp(`<div\\b[^>]*\\bid="${id}"[^>]*>`);
  const match = openRe.exec(html);
  if (!match) return html;
  let index = match.index + match[0].length;
  let depth = 1;
  const start = index;
  while (index < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', index);
    const nextClose = html.indexOf('</div>', index);
    if (nextClose === -1) throw new Error(`Unclosed mount #${id}`);
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      index = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) return html.slice(0, start) + inner + html.slice(nextClose);
      index = nextClose + 6;
    }
  }
  throw new Error(`Unclosed mount #${id}`);
}

function setAttr(html, id, attr, value) {
  const re = new RegExp(`(<[^>]*\\bid="${id}"[^>]*\\b${attr}=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`Missing #${id} ${attr}`);
  return html.replace(re, `$1${esc(value)}$2`);
}

function setByAttr(html, attrName, attrValue, target, value) {
  const re = new RegExp(`(<[^>]*\\b${attrName}="${attrValue}"[^>]*\\b${target}=")[^"]*(")`);
  const reAlt = new RegExp(`(<[^>]*\\b${target}="[^"]*"[^>]*\\b${attrName}="${attrValue}"[^>]*>)`);
  if (re.test(html)) return html.replace(re, `$1${esc(value)}$2`);
  // attribute order: target before the identifying attribute (canonical link uses href only)
  if (attrName === 'rel' && target === 'href') {
    const link = new RegExp(`(<link\\b[^>]*\\brel="${attrValue}"[^>]*\\bhref=")[^"]*(")`);
    if (link.test(html)) return html.replace(link, `$1${esc(value)}$2`);
  }
  if (!reAlt.test(html)) throw new Error(`Missing ${attrName}=${attrValue}`);
  return html;
}

function fill(shell, lang) {
  const file = lang === 'ar' ? 'ar/content.md' : 'content.md';
  const { meta, sections } = parseContent(read(file));
  let html = shell;
  const mounts = renderMounts(meta, sections, lang);
  for (const [id, inner] of Object.entries(mounts)) {
    html = replaceMount(html, id, inner);
  }
  for (const [href, key] of NAV_MAP) {
    html = html.replace(
      new RegExp(`(<a href="${href.replace('#', '\\#')}">)[\\s\\S]*?(</a>)`),
      `$1${esc(t(key, lang))}$2`
    );
  }
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  html = html.replace(/<html\b[^>]*>/, `<html lang="${lang}" dir="${dir}">`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title || meta.name)}</title>`);
  html = setAttr(html, 'meta-description', 'content', meta.description || '');
  html = setAttr(html, 'og-title', 'content', meta.og_title || meta.title || meta.name || '');
  html = setAttr(html, 'og-description', 'content', meta.og_description || meta.description || '');
  html = setAttr(html, 'twitter-title', 'content', meta.og_title || meta.title || meta.name || '');
  html = setAttr(html, 'twitter-description', 'content', meta.og_description || meta.description || '');
  const canonical = lang === 'ar' ? `${SITE}/ar/` : `${SITE}/`;
  html = setByAttr(html, 'rel', 'canonical', 'href', canonical);
  html = setByAttr(html, 'property', 'og:url', 'content', canonical);
  html = setByAttr(html, 'property', 'og:locale', 'content', lang === 'ar' ? 'ar_SA' : 'en_US');
  const back = t('controls.backToTop', lang);
  html = html.replace(/(<button id="back-to-top"[^>]*aria-label=")[^"]*(")/, `$1${esc(back)}$2`);
  html = injectSchema(stripGeneratedSchema(html), sections);
  return { html, meta };
}

function answerText(entry) {
  const bits = [...entry.paragraphs];
  for (const bullet of entry.bullets) {
    bits.push(typeof bullet === 'string' ? bullet : `${bullet.value} | ${bullet.label}`);
  }
  return bits.join(' ');
}

function stripGeneratedSchema(html) {
  return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, (block) => {
    if (block.includes('"FAQPage"') || block.includes('"HowTo"')) return '';
    return block;
  });
}

function injectSchema(html, sections) {
  const questions = [];
  for (const name of ['Definition', 'FAQ']) {
    const section = sections[name];
    if (!section) continue;
    for (const entry of section.entries) {
      questions.push({
        '@type': 'Question',
        name: entry.title,
        acceptedAnswer: { '@type': 'Answer', text: answerText(entry) },
      });
    }
  }
  const blocks = [];
  if (questions.length) {
    blocks.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions });
  }
  if (sections.How && sections.How.entries.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: sections.How.attrs.heading || 'How we work',
      step: sections.How.entries.map((entry, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: entry.title,
        text: answerText(entry),
      })),
    });
  }
  if (!blocks.length) return html;
  const json = JSON.stringify(blocks.length === 1 ? blocks[0] : blocks, null, 2).replace(/</g, '\\u003c');
  return html.replace('</head>', `<script type="application/ld+json">\n${json}\n</script>\n</head>`);
}

function prefixRelative(html, prefix) {
  if (!prefix) return html;
  return html.replace(/(href|src)="(?!https?:|#|mailto:|tel:|\/\/)([^"]*)"/g, (full, attr, url) => {
    return `${attr}="${prefix}${url}"`;
  });
}

function hashScripts(html) {
  const hashes = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html))) {
    const digest = `'sha256-${createHash('sha256').update(match[1], 'utf8').digest('base64')}'`;
    if (!hashes.includes(digest)) hashes.push(digest);
  }
  if (!hashes.length) return html;
  return html.replace(/script-src [^;"]+/, `script-src 'self' ${hashes.join(' ')}`);
}

function writeSitemap(extraPairs = []) {
  const pairs = [{ en: `${SITE}/`, ar: `${SITE}/ar/` }, ...extraPairs];
  const body = pairs
    .flatMap((pair) => {
      const locs = [pair.en, pair.ar].filter(Boolean);
      return locs.map((loc) => {
        const links = [
          `    <xhtml:link rel="alternate" hreflang="en" href="${pair.en}"/>`,
          pair.ar ? `    <xhtml:link rel="alternate" hreflang="ar" href="${pair.ar}"/>` : '',
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${pair.en}"/>`,
        ]
          .filter(Boolean)
          .join('\n');
        return `  <url>\n    <loc>${loc}</loc>\n${links}\n  </url>`;
      });
    })
    .join('\n');
  const cv = `  <url>\n    <loc>${SITE}/media/Mahmoud%20Hawa%20CV.pdf</loc>\n  </url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n${cv}\n</urlset>\n`;
  writeFileSync(join(root, 'sitemap.xml'), xml);
}

const shell = read('index.html');
const en = fill(shell, 'en');
writeFileSync(join(root, 'index.html'), hashScripts(en.html));

let arHtml = fill(shell, 'ar').html;
arHtml = prefixRelative(arHtml, '../');
arHtml = arHtml.replace(
  /<a id="lang-toggle"[^>]*>[\s\S]*?<\/a>/,
  '<a id="lang-toggle" class="control-btn" href="../" hreflang="en" lang="en" aria-label="EN – Switch language to English">EN</a>'
);
arHtml = arHtml.replace(
  /(<meta name="mh-asset-prefix" content=")[^"]*(")/,
  '$1../$2'
);
arHtml = arHtml.replace(
  /<link rel="preload" href="(?:\.\.\/)*assets\/fonts\/inter-latin\.woff2"/,
  '<link rel="preload" href="../assets/fonts/inter-latin.woff2"'
);
// Arabic text should not wait on a second round trip for Tajawal.
if (!arHtml.includes('tajawal-arabic-400.woff2')) {
  arHtml = arHtml.replace(
    '</head>',
    '    <link rel="preload" href="../assets/fonts/tajawal-arabic-400.woff2" as="font" type="font/woff2" crossorigin />\n    <link rel="preload" href="../assets/fonts/tajawal-arabic-700.woff2" as="font" type="font/woff2" crossorigin />\n  </head>'
  );
}
mkdirSync(join(root, 'ar'), { recursive: true });
writeFileSync(join(root, 'ar/index.html'), hashScripts(arHtml));

function replaceMain(html, inner) {
  const match = html.match(/<main\b[^>]*>/);
  if (!match) throw new Error('Missing <main>');
  let index = match.index + match[0].length;
  let depth = 1;
  const start = index;
  while (index < html.length && depth > 0) {
    const nextOpen = html.indexOf('<main', index);
    const nextClose = html.indexOf('</main>', index);
    if (nextClose === -1) throw new Error('Unclosed <main>');
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      index = nextOpen + 5;
    } else {
      depth -= 1;
      if (depth === 0) return html.slice(0, start) + inner + html.slice(nextClose);
      index = nextClose + 7;
    }
  }
  throw new Error('Unclosed <main>');
}

function servicePairs() {
  const dir = join(root, 'services');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => {
    return (
      existsSync(join(dir, name, 'content.md')) &&
      existsSync(join(root, 'ar', 'services', name, 'content.md'))
    );
  });
}

function buildServicePage(slug, lang) {
  const enPath = `/services/${slug}/`;
  const arPath = `/ar/services/${slug}/`;
  const isAr = lang === 'ar';
  const file = isAr ? join(root, 'ar', 'services', slug, 'content.md') : join(root, 'services', slug, 'content.md');
  const { meta, sections } = parseContent(readFileSync(file, 'utf8'));
  const prefix = isAr ? '../../../' : '../../';
  const home = '../../';
  let html = shell;
  html = replaceMain(html, renderArticle(meta, sections, lang));
  const homeContent = parseContent(read(isAr ? 'ar/content.md' : 'content.md'));
  html = replaceMount(html, 'footer-mount', renderFooter(homeContent.meta, homeContent.sections.Contact, lang));
  for (const [href, key] of NAV_MAP) {
    html = html.replace(
      new RegExp(`(<a href="${href.replace('#', '\\#')}">)[\\s\\S]*?(</a>)`),
      `$1${esc(t(key, lang))}$2`
    );
  }
  const back = t('controls.backToTop', lang);
  html = html.replace(/(<button id="back-to-top"[^>]*aria-label=")[^"]*(")/, `$1${esc(back)}$2`);
  html = injectSchema(stripGeneratedSchema(html), sections);
  const dirAttr = isAr ? 'rtl' : 'ltr';
  html = html.replace(/<html\b[^>]*>/, `<html lang="${lang}" dir="${dirAttr}">`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title || '')}</title>`);
  html = setAttr(html, 'meta-description', 'content', meta.description || '');
  html = setAttr(html, 'og-title', 'content', meta.og_title || meta.title || '');
  html = setAttr(html, 'og-description', 'content', meta.og_description || meta.description || '');
  html = setAttr(html, 'twitter-title', 'content', meta.og_title || meta.title || '');
  html = setAttr(html, 'twitter-description', 'content', meta.og_description || meta.description || '');
  const canonical = `${SITE}${isAr ? arPath : enPath}`;
  html = setByAttr(html, 'rel', 'canonical', 'href', canonical);
  html = setByAttr(html, 'property', 'og:url', 'content', canonical);
  html = setByAttr(html, 'property', 'og:locale', 'content', isAr ? 'ar_SA' : 'en_US');
  html = html.replace(
    /<link rel="alternate" hreflang="en" href="[^"]*" \/>/,
    `<link rel="alternate" hreflang="en" href="${SITE}${enPath}" />`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="ar" href="[^"]*" \/>/,
    `<link rel="alternate" hreflang="ar" href="${SITE}${arPath}" />`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="x-default" href="[^"]*" \/>/,
    `<link rel="alternate" hreflang="x-default" href="${SITE}${enPath}" />`
  );
  html = prefixRelative(html, prefix);
  html = html.replace(/href="#([^"]*)"/g, `href="${home}#$1"`);
  const toggle = isAr
    ? `<a id="lang-toggle" class="control-btn" href="../../../services/${slug}/" hreflang="en" lang="en" aria-label="EN – Switch language to English">EN</a>`
    : `<a id="lang-toggle" class="control-btn" href="../../ar/services/${slug}/" hreflang="ar" lang="ar" aria-label="AR – Switch language to Arabic">AR</a>`;
  html = html.replace(/<a id="lang-toggle"[^>]*>[\s\S]*?<\/a>/, toggle);
  if (!html.includes('name="mh-static"')) {
    html = html.replace('<meta name="mh-content"', '<meta name="mh-static" content="1" />\n    <meta name="mh-content"');
  }
  const outDir = isAr ? join(root, 'ar', 'services', slug) : join(root, 'services', slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), hashScripts(html));
}

const pairs = [];
for (const slug of servicePairs()) {
  buildServicePage(slug, 'en');
  buildServicePage(slug, 'ar');
  pairs.push({ en: `${SITE}/services/${slug}/`, ar: `${SITE}/ar/services/${slug}/` });
}
writeSitemap(pairs);
console.log(`Prerendered ${root}/index.html and ${root}/ar/index.html (${pairs.length} service pairs)`);
