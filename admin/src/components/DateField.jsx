import { useRef } from 'react';
import { formatLongDate, fromDateInput, toDateInput, today } from '../site';

// Shows the date as "17 October 2026"; clicking opens the native date picker.
export default function DateField({ value, onChange }) {
  const input = useRef(null);

  const open = () => {
    const el = input.current;
    try { el.showPicker(); } catch { el.focus(); }
  };

  return (
    <label className="date-field">
      <span>Date</span>
      <button type="button" className="date-display" onClick={open}>
        {formatLongDate(value) || 'Pick a date'}
      </button>
      <input
        ref={input}
        type="date"
        className="date-native"
        tabIndex={-1}
        aria-hidden="true"
        value={toDateInput(value)}
        onChange={e => onChange(e.target.value ? fromDateInput(e.target.value) : today())}
      />
    </label>
  );
}
