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
    phone: { en: 'Phone', ar: 'الهاتف' },
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
    certifications: { en: 'Key Certifications', ar: 'الشهادات المهنية' },
  },
  footer: {
    heading: {
      en: 'Let’s build the next chapter of business transformation.',
      ar: 'لنبنِ معاً الفصل القادم من التحول في الأعمال.',
    },
  },
  controls: {
    langToggleLabel: { en: 'AR', ar: 'EN' }, // shows the OTHER language
    langToggleAria: { en: 'Switch to Arabic', ar: 'Switch to English' },
    themeToLight: { en: 'Switch to light mode', ar: 'التبديل إلى الوضع الفاتح' },
    themeToDark: { en: 'Switch to dark mode', ar: 'التبديل إلى الوضع الداكن' },
    backToTop: { en: 'Back to top', ar: 'العودة إلى الأعلى' },
  },
};

export function t(path, lang) {
  const node = path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), UI);
  if (!node) return '';
  return node[lang] || node.en || '';
}

const LANG_KEY = 'site-lang';
const THEME_KEY = 'site-theme';

export function getStoredLang() {
  try {
    return localStorage.getItem(LANG_KEY) || 'en';
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
    if (stored) return stored;
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
