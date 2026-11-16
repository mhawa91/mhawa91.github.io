document.addEventListener('DOMContentLoaded', () => {
  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  const targets = navLinks
    .map((link) => {
      // Service pages link back to home-page sections ("../../#about"); only
      // same-page anchors can be looked up, so skip anything else.
      const href = link.getAttribute('href') || '';
      if (!/^#[A-Za-z][\w-]*$/.test(href)) return { link, section: null };
      return { link, section: document.getElementById(href.slice(1)) };
    })
    .filter((t) => t.section);
  const header = document.querySelector('.site-header');
  const backToTop = document.getElementById('back-to-top');

  const setActive = (link) => {
    navLinks.forEach((l) => l.classList.toggle('active', l === link));
  };

  const updateNavSpy = () => {
    if (!targets.length) return;
    const offset = (header ? header.offsetHeight : 0) + 24;

    // At the bottom of the page, always highlight the last link (Contact).
    // The footer is short, so the mid-viewport detection band below can miss
    // it entirely once the page can't scroll any further.
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) {
      setActive(targets[targets.length - 1].link);
      return;
    }

    let current = targets[0];
    for (const t of targets) {
      if (t.section.getBoundingClientRect().top - offset <= 0) {
        current = t;
      }
    }
    setActive(current.link);
  };

  const updateBackToTop = () => {
    if (!backToTop) return;
    backToTop.classList.toggle('visible', window.scrollY > 320);
  };

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        updateNavSpy();
        updateBackToTop();
      });
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  updateNavSpy();
  updateBackToTop();
});

// Soft fade-up as cards scroll into view. Purely decorative: skipped when the
// visitor prefers reduced motion or the browser lacks IntersectionObserver,
// and anything already on screen is shown immediately.
(function () {
  const REVEAL_SELECTOR =
    '.section-heading, .stat-tile, .about-grid, .skill-grid, .service-card, .project-card, .timeline-item, .edu-card';
  let observer = null;

  document.addEventListener('content:rendered', () => {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;

    if (observer) observer.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );

    document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
      el.classList.add('reveal');
      observer.observe(el);
    });

    // Safety net: never leave content invisible if the observer misfires.
    window.setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('in');
      });
    }, 1200);
  });
})();
