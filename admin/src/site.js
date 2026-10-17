// Helpers shared by the dashboard and the editor.

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

// today as YYYY-MM-DD in the writer's own timezone
export const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const format = (value, options) => new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(new Date(value));

// "17 October 2026", matching the date in the site header. A plain YYYY-MM-DD is read as that
// calendar day; a timestamp is shown in the writer's own timezone.
export const formatLongDate = value => {
  if (!value) return '';
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  return /^d{4}-d{2}-d{2}$/.test(value)
    ? format(value, options)
    : new Intl.DateTimeFormat('en-GB', options).format(new Date(value));
};

// project dates are shown at the precision they were entered: "2026", "October 2026", "17 October 2026"
export const formatProjectDate = (date, precision) => {
  if (!date) return '';
  if (precision === 'year') return date.slice(0, 4);
  if (precision === 'month') return format(date, { month: 'long', year: 'numeric' });
  return formatLongDate(date);
};
