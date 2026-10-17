import { useRef } from 'react';
import { formatLongDate, todayDate } from '../site';

const MONTHS = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(Date.UTC(2000, i, 1)));
const PRECISIONS = [['year', 'Year'], ['month', 'Month'], ['day', 'Full date']];

// When the project happened, as a year, a month and year, or a full date.
// value: YYYY-MM-DD (trimmed to the precision by the database) or null.
export default function ProjectDate({ value, precision, onChange }) {
  const picker = useRef(null);
  const date = value || todayDate();
  const [year, month] = [Number(date.slice(0, 4)), Number(date.slice(5, 7))];

  const set = (nextDate, nextPrecision = precision) => onChange({ project_date: nextDate, project_date_precision: nextPrecision });
  const setYear = y => y >= 1900 && y <= 2200 && set(`${y}-${date.slice(5)}`);
  const openPicker = () => {
    try { picker.current.showPicker(); } catch { picker.current.focus(); }
  };

  return (
    <div className="project-date">
      <span>Project date</span>
      <select value={precision} onChange={e => set(date, e.target.value)} aria-label="Project date precision">
        {PRECISIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>

      {precision === 'month' && (
        <select value={month} onChange={e => set(`${year}-${String(e.target.value).padStart(2, '0')}-01`)} aria-label="Month">
          {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
        </select>
      )}
      {precision !== 'day' && (
        <input type="number" className="year-input" min="1900" max="2200" value={year} onChange={e => setYear(Number(e.target.value))} aria-label="Year" />
      )}
      {precision === 'day' && (
        <span className="date-field">
          <button type="button" className="date-display" onClick={openPicker}>{formatLongDate(date)}</button>
          <input
            ref={picker}
            type="date"
            className="date-native"
            tabIndex={-1}
            aria-hidden="true"
            value={date}
            onChange={e => e.target.value && set(e.target.value)}
          />
        </span>
      )}
      {!value && <span className="muted">(not set yet, saves as shown)</span>}
    </div>
  );
}
