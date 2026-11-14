// Runs synchronously in <head>, before first paint, to avoid a flash of the
// wrong theme/language. Kept as an external file (not an inline <script>) so
// the page's Content-Security-Policy can forbid inline scripts entirely.
// lib/content-loader.js re-confirms and owns this state once it runs.
(function () {
  var root = document.documentElement;
  var theme = null;
  var lang = 'en';

  try {
    theme = localStorage.getItem('site-theme');
    lang = localStorage.getItem('site-lang') === 'ar' ? 'ar' : 'en';
  } catch (e) {
    /* localStorage unavailable (private mode, etc.) — defaults apply */
  }

  // Stored values are validated, never applied as-is.
  if (theme !== 'light' && theme !== 'dark') {
    var prefersLight = false;
    try {
      prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    } catch (e) {
      /* ignore */
    }
    theme = prefersLight ? 'light' : 'dark';
  }

  root.setAttribute('data-theme', theme);
  root.setAttribute('lang', lang);
  root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  root.classList.add('js');

  // The /staging/ preview copy must never be indexed by search engines.
  if (/^\/staging(\/|$)/.test(window.location.pathname)) {
    var robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
  }
})();
