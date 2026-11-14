// Discovery-call booking.
// TODO: Google Calendar Appointment Schedule URL.
// Paste the https://calendar.google.com/... link on the next line (one change).
// Leave it empty to keep every discovery-call control on #contact, in the same tab.
// When this is a non-empty https URL, every control uses it, opens in a new tab,
// and sets rel="noopener". form-action stays 'none'; this is a link, not a form.
export const BOOKING_URL = '';

export function bookingAnchor(className, label) {
  const url = String(BOOKING_URL || '').trim();
  if (/^https:\/\//i.test(url)) {
    const href = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return `<a class="${className}" href="${href}" target="_blank" rel="noopener">${label}</a>`;
  }
  return `<a class="${className}" href="#contact">${label}</a>`;
}
