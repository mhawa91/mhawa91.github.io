document.addEventListener('DOMContentLoaded', () => {
  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  const targets = navLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
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
