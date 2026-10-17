import { useCallback, useEffect, useRef, useState } from 'react';
import { getHealth, uploadResume } from './api';
import { openExternal, resolveSiteUrl } from './site';
import Workspace from './components/Workspace';
import BlocksPanel from './components/BlocksPanel';

// Panel widths, docked on the right of the site preview
const SIZES = { side: '40%', half: '50%', full: '100%' };

const stored = (key, fallback) => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};
const store = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* private window etc. */ }
};

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getHealth().then(setHealth).catch(err => setError(err.message));
  }, []);

  if (error || (health && !health.configured)) {
    return (
      <div className="center-screen">
        <div className="card">
          <h1>Almost there</h1>
          {error ? (
            <p>Can't reach the local admin server: {error}. Start it with <code>npm run admin</code> from the repo root.</p>
          ) : (
            <p>Copy <code>admin/.env.example</code> to <code>admin/.env</code>, fill in your Supabase URL and service role key, then restart.</p>
          )}
        </div>
      </div>
    );
  }
  if (!health) return null;
  return <Dashboard siteUrl={health.siteUrl} />;
}

function Dashboard({ siteUrl }) {
  const [source, setSource] = useState(() => stored('admin.source', siteUrl ? 'live' : 'local'));
  const [size, setSize] = useState(() => stored('admin.panel', 'side'));
  const [tab, setTab] = useState(() => stored('admin.tab', 'page'));
  const [page, setPage] = useState({ path: '/', blocks: [] });
  const [previewPath, setPreviewPath] = useState('/');
  const [reloadKey, setReloadKey] = useState(0);
  const [focusBlock, setFocusBlock] = useState(null);
  const [postRequest, setPostRequest] = useState(null); // { action: 'new', kind } | { action: 'open', slug }
  const [toast, setToast] = useState(null);
  const frame = useRef(null);
  const resumeInput = useRef(null);

  const base = source === 'live' ? resolveSiteUrl(siteUrl) : 'http://localhost:3000';
  const origin = new URL(base).origin;

  useEffect(() => store('admin.source', source), [source]);
  useEffect(() => store('admin.panel', size), [size]);
  useEffect(() => store('admin.tab', tab), [tab]);

  // messages from components/AdminBridge.js on the site
  useEffect(() => {
    const onMessage = e => {
      if (e.origin !== origin || e.source !== frame.current?.contentWindow) return;
      const msg = e.data || {};
      if (msg.type === 'site:page') {
        setPage({ path: msg.path, blocks: Array.isArray(msg.blocks) ? msg.blocks : [] });
      } else if (msg.type === 'site:add-post' && (msg.kind === 'project' || msg.kind === 'blog')) {
        openPost({ action: 'new', kind: msg.kind });
      } else if (msg.type === 'site:edit-post' && typeof msg.slug === 'string') {
        openPost({ action: 'open', slug: msg.slug });
      } else if (msg.type === 'site:edit-block') {
        setTab('page');
        if (size === 'closed') setSize('side');
        setFocusBlock({ id: msg.id, at: Date.now() });
      } else if (msg.type === 'site:upload' && msg.kind === 'resume') {
        resumeInput.current.click();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [origin, size]);

  // switch the panel to the post editor with a new or existing post
  function openPost(request) {
    setTab('posts');
    setSize(s => (s === 'closed' ? 'side' : s));
    setPostRequest({ ...request, at: Date.now() });
  }

  const hello = () => frame.current?.contentWindow?.postMessage({ type: 'admin:hello' }, origin);

  // reload the preview at `path` after the live site re-rendered it
  const onSiteChanged = useCallback(path => {
    setPreviewPath(path || page.path);
    setReloadKey(k => k + 1);
  }, [page.path]);

  const flash = (kind, text) => {
    setToast({ kind, text });
    setTimeout(() => setToast(t => (t?.text === text ? null : t)), 5000);
  };

  const uploadNewResume = async file => {
    if (file.type !== 'application/pdf') return flash('error', 'Pick a PDF file');
    try {
      await uploadResume(file);
      flash('ok', 'Resume updated — /resume serves it within a minute');
    } catch (err) {
      flash('error', `Resume upload failed: ${err.message}`);
    }
  };

  const postSlug = page.path.startsWith('/blog/') ? page.path.slice(6) : null;
  const panelOpen = size !== 'closed';

  return (
    <div className="shell">
      <header className="topbar">
        <span className="topbar-title">blog admin</span>
        <span className="topbar-path"><code>{page.path}</code></span>
        <div className="topbar-group">
          <button onClick={() => onSiteChanged(page.path)} title="Reload the preview">↻</button>
          <button onClick={() => openExternal(base + page.path)}>Open in browser ↗</button>
          <select value={source} onChange={e => { setSource(e.target.value); setPreviewPath('/'); }} aria-label="Preview source">
            <option value="live">Live site</option>
            <option value="local">localhost:3000</option>
          </select>
        </div>
        <div className="topbar-group" role="group" aria-label="Editor size">
          {[['side', 'Sidebar'], ['half', 'Half'], ['full', 'Full'], ['closed', 'Hide']].map(([value, label]) => (
            <button key={value} className={size === value ? 'active' : ''} onClick={() => setSize(value)}>{label}</button>
          ))}
        </div>
      </header>

      <div className="split">
        <iframe
          ref={frame}
          key={`${base}-${reloadKey}`}
          className="preview"
          title="Site preview"
          src={base + previewPath}
          onLoad={hello}
          style={{ display: size === 'full' ? 'none' : undefined }}
        />

        {panelOpen && (
          <aside className="panel" style={{ width: SIZES[size] }}>
            <nav className="panel-tabs">
              <button className={tab === 'page' ? 'active' : ''} onClick={() => setTab('page')}>Page text</button>
              <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Posts</button>
            </nav>
            <div className="panel-body">
              {tab === 'page' ? (
                <BlocksPanel path={page.path} pageBlocks={page.blocks} focusBlock={focusBlock} onSiteChanged={onSiteChanged} onOpenPost={openPost} />
              ) : (
                <Workspace siteUrl={siteUrl} focusSlug={postSlug} request={postRequest} onSiteChanged={onSiteChanged} />
              )}
            </div>
          </aside>
        )}
      </div>

      <input
        ref={resumeInput}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={e => { if (e.target.files[0]) uploadNewResume(e.target.files[0]); e.target.value = ''; }}
      />
      {toast && <div className={`toast notice ${toast.kind}`} role="status">{toast.text}</div>}
    </div>
  );
}
