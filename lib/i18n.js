// UI "chrome" strings — anything on the page that is NOT resume/profile content
// (that lives in content.md / ar/content.md). Nav labels, buttons, eyebrows,
// and the language/theme control labels all come from here so the whole page
// switches language in one call.

export const UI = {
  nav: {
    about: { en: 'About', ar: 'نبذة' },
    services: { en: 'Services', ar: 'الخدمات' },
    achievements: { en: 'Achievements', ar: 'الإنجازات' },
    experience: { en: 'Experience', ar: 'الخبرات' },
    ventures: { en: 'Ventures', ar: 'المشاريع' },
    education: { en: 'Education', ar: 'التعليم' },
    contact: { en: 'Contact', ar: 'تواصل' },
  },
  hero: {
    greeting: { en: 'Hello, I’m', ar: 'مرحباً، أنا' },
    ctaExperience: { en: 'View Experience', ar: 'عرض الخبرات' },
    ctaContact: { en: 'Contact Me', ar: 'تواصل معي' },
    ctaResume: { en: 'Download CV', ar: 'تحميل السيرة الذاتية' },
    linkedin: { en: 'LinkedIn', ar: 'لينكدإن' },
    email: { en: 'Email', ar: 'البريد الإلكتروني' },
    basedIn: { en: 'Based in', ar: 'مقيم في' },
    visionTag: { en: 'Vision 2030', ar: 'رؤية 2030' },
  },
  eyebrows: {
    about: { en: 'About', ar: 'نبذة عني' },
    services: { en: 'Services', ar: 'الخدمات' },
    achievements: { en: 'Achievements', ar: 'الإنجازات' },
    experience: { en: 'Experience', ar: 'الخبرة العملية' },
    ventures: { en: 'Ventures', ar: 'المشاريع والاستثمار' },
    education: { en: 'Education & Credentials', ar: 'التعليم والشهادات' },
    contact: { en: 'Contact', ar: 'تواصل' },
  },
  education: {
    certifications: { en: 'Certifications & Professional Training', ar: 'الشهادات والتدريب المهني' },
    volunteer: { en: 'Volunteer Experience', ar: 'العمل التطوعي' },
  },
  experience: {
    showMore: { en: 'Show more', ar: 'عرض المزيد' },
    showLess: { en: 'Show less', ar: 'عرض أقل' },
  },
  footer: {
    heading: {
      en: 'Let’s build the next chapter of business transformation.',
      ar: 'لنبنِ معاً الفصل القادم من التحول في الأعمال.',
    },
  },
  controls: {
    langToggleLabel: { en: 'AR', ar: 'EN' }, // shows the OTHER language
    langToggleAria: { en: 'AR – Switch language to Arabic', ar: 'EN – Switch language to English' },
    themeToLight: { en: 'Switch to light mode', ar: 'التبديل إلى الوضع الفاتح' },
    themeToDark: { en: 'Switch to dark mode', ar: 'التبديل إلى الوضع الداكن' },
    backToTop: { en: 'Back to top', ar: 'العودة إلى الأعلى' },
    menuOpen: { en: 'Open menu', ar: 'فتح القائمة' },
    menuClose: { en: 'Close menu', ar: 'إغلاق القائمة' },
    loadError: {
      en: 'Site content failed to load. Please refresh the page.',
      ar: 'تعذّر تحميل محتوى الموقع. يرجى تحديث الصفحة.',
    },
  },
};

export function t(path, lang) {
  const node = path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), UI);
  if (!node) return '';
  return node[lang] || node.en || '';
}

const LANG_KEY = 'site-lang';
const THEME_KEY = 'site-theme';

// Stored values are validated against an allow-list: localStorage is
// writable by anything running on this origin, so it is never trusted as-is.
export function getStoredLang() {
  try {
    return localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'en';
  } catch (e) {
    return 'en';
  }
}

export function setStoredLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (e) {
    /* ignore (private browsing, storage disabled, etc.) */
  }
}

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (e) {
    /* ignore */
  }
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch (e) {
    return 'dark';
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    /* ignore */
  }
}
