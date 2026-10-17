import { useEffect, useState } from 'react';
import { getDateHistory } from '../api';
import { formatLongDate } from '../site';

// Every date a post has had. `version` changes after each save so the list refreshes.
export default function DateHistory({ postId, version }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!postId) return setRows([]);
    getDateHistory(postId).then(setRows).catch(() => setRows([]));
  }, [postId, version]);

  if (rows.length < 2) return null; // only the original date so far

  return (
    <details className="date-history">
      <summary>Date history ({rows.length - 1} change{rows.length === 2 ? '' : 's'})</summary>
      <ol>
        {rows.map((row, i) => (
          <li key={i}>
            {row.old_published_at
              ? <>{formatLongDate(row.old_published_at)} → <strong>{formatLongDate(row.new_published_at)}</strong></>
              : <>Created as <strong>{formatLongDate(row.new_published_at)}</strong></>}
            <span className="muted"> · changed {new Date(row.changed_at).toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
