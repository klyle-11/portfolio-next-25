import { useEffect, useState } from 'react';
import { getPostHistory } from '../api';
import { formatProjectDate } from '../site';

// Admin-only log: drafted, every public/private switch, every project date.
// `version` changes after each save so the list refreshes.
const describeDate = value => {
  if (!value) return 'none';
  const [date, precision] = value.split(' ');
  return formatProjectDate(date, precision);
};

const describe = row => {
  switch (row.event) {
    case 'drafted': return 'Drafted';
    case 'made_public': return 'Made public';
    case 'made_private': return 'Made private';
    case 'project_date': return row.old_value
      ? <>Project date {describeDate(row.old_value)} → <strong>{describeDate(row.new_value)}</strong></>
      : <>Project date set to <strong>{describeDate(row.new_value)}</strong></>;
    default: return row.event;
  }
};

export default function PostHistory({ postId, version }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!postId) return setRows([]);
    getPostHistory(postId).then(setRows).catch(() => setRows([]));
  }, [postId, version]);

  if (!rows.length) return null;

  return (
    <details className="date-history">
      <summary>History ({rows.length})</summary>
      <ol>
        {rows.map((row, i) => (
          <li key={i}>
            {describe(row)}
            <span className="muted"> · {new Date(row.changed_at).toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
