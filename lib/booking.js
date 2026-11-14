// Discovery-call booking. One setting for every button.
// Google Calendar Appointment Schedule. The host is calendar.app.google.
// form-action stays 'none'; this is a link, not a form. CSP does not
// restrict top-level navigation, so calendar.app.google is allowed.
export const BOOKING_URL = 'https://calendar.app.google/v999A6aR7XRWAp5B9';

export function bookingAnchor(className, label) {
  const url = String(BOOKING_URL || '').trim();
  let host = '';
  try {
    host = new URL(url).host;
  } catch (e) {
    host = '';
  }
  // Appointment links are served from calendar.app.google.
  if (host === 'calendar.app.google' && url.startsWith('https://')) {
    const href = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return `<a class="${className}" href="${href}" target="_blank" rel="noopener">${label}</a>`;
  }
  return `<a class="${className}" href="#contact">${label}</a>`;
}
