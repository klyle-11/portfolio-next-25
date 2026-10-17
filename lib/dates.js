// Dates on the site read like the header: "17 October 2026".
const format = (value, options) => new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(new Date(value));

export const formatLongDate = value => (value ? format(value, { day: '2-digit', month: 'long', year: 'numeric' }) : '');

// project dates keep the precision they were entered at: "2026", "October 2026", "17 October 2026"
export const formatProjectDate = (date, precision) => {
    if (!date) return '';
    if (precision === 'year') return String(date).slice(0, 4);
    if (precision === 'month') return format(date, { month: 'long', year: 'numeric' });
    return formatLongDate(date);
};
