// Helpers shared by the admin chrome (header/footer) and the editor.

// when admin/.env has no SITE_URL, link to the local Next dev server
export const resolveSiteUrl = siteUrl => siteUrl || 'http://localhost:3000';

export async function openExternal(url) {
  if (window.__TAURI_INTERNALS__) {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    return openUrl(url);
  }
  window.open(url, '_blank', 'noopener');
}

const pad = n => String(n).padStart(2, '0');

// <input type="date"> works in YYYY-MM-DD; store noon UTC so the date doesn't shift across timezones
export const toDateInput = iso => (iso ? iso.slice(0, 10) : '');
export const fromDateInput = value => (value ? `${value}T12:00:00.000Z` : null);

// today in the writer's own timezone, stored the same way as a picked date
export const today = () => {
  const d = new Date();
  return fromDateInput(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
};

// "17 October 2026", matching the date in the site header
export const formatLongDate = iso => (iso
  ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso))
  : '');
