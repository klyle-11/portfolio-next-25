import { useEffect, useRef, useState } from 'react';
import { getResume, uploadResume } from '../api';
import { formatLongDate, openExternal, resolveSiteUrl } from '../site';

// Replaces the PDF behind the site's /resume link.
export default function ResumePanel({ siteUrl, onNotice }) {
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const link = `${resolveSiteUrl(siteUrl)}/resume`;

  useEffect(() => {
    getResume().then(setInfo).catch(() => setInfo({ uploaded: false }));
  }, []);

  const upload = async file => {
    if (file.type !== 'application/pdf') return onNotice('error', 'Pick a PDF file');
    setBusy(true);
    try {
      setInfo(await uploadResume(file));
      onNotice('ok', 'Resume updated, the site links to it within a minute');
    } catch (err) {
      onNotice('error', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="resume-panel">
      <h2>Resume</h2>
      <p className="muted">
        {info?.uploaded ? `Updated ${formatLongDate(info.updated_at)}` : 'Using the PDF bundled with the site'}
      </p>
      <div className="resume-actions">
        <button disabled={busy} onClick={() => input.current.click()}>{busy ? 'Uploading…' : 'Upload PDF'}</button>
        <button onClick={() => openExternal(link)}>Open ↗</button>
      </div>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={e => { if (e.target.files[0]) upload(e.target.files[0]); e.target.value = ''; }}
      />
    </section>
  );
}
