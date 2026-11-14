// Runs synchronously in <head>, before first paint, to avoid a flash of the
// wrong theme. Kept as an external file (not an inline <script>) so the
// page's Content-Security-Policy can forbid inline scripts entirely.
// Language is the URL (English at /, Arabic at /ar/), already set on <html>.
// lib/content-loader.js owns theme toggling once it runs.
(function () {
  var root = document.documentElement;
  var theme = null;

  try {
    theme = localStorage.getItem('site-theme');
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
  root.classList.add('js');

  // The /staging/ preview copy must never be indexed by search engines.
  // The deploy also injects a static meta tag; this covers a preview opened
  // before that inject, and raw files under /staging/.
  if (/^\/staging(\/|$)/.test(window.location.pathname)) {
    var robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
  }
})();
