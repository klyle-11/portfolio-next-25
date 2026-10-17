import { useEffect, useState } from 'react';
import { listBlocks, listPosts, saveBlock, uploadImage, revalidate } from '../api';
import RichEditor from './RichEditor';
import ConfirmDialog from './ConfirmDialog';

// Edits the text blocks on the page open in the preview (bio, project blurbs, …).
// `pageBlocks` comes from the site itself: [{ id, label, md }] with the text it's showing now.
// onOpenPost({ action: 'new', kind } | { action: 'open', slug }) hands off to the post editor.
export default function BlocksPanel({ path, pageBlocks, focusBlock, onSiteChanged, onOpenPost }) {
  const [projects, setProjects] = useState([]);
  const [saved, setSaved] = useState({}); // key → row from Supabase
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    listPosts().then(posts => setProjects(posts.filter(p => p.kind === 'project'))).catch(() => {});
  }, []);

  useEffect(() => {
    listBlocks()
      .then(rows => setSaved(Object.fromEntries(rows.map(r => [r.key, r]))))
      .catch(err => setNotice({ kind: 'error', text: err.message }));
  }, []);

  const open = id => {
    const block = pageBlocks.find(b => b.id === id);
    setSelected(id);
    setContent(saved[id]?.content_md ?? block?.md ?? '');
    setDirty(false);
    setNotice(null);
    setEditorKey(k => k + 1);
  };

  const select = id => {
    if (id === selected) return;
    if (!dirty) return open(id);
    setConfirm({
      title: 'Discard unsaved changes?',
      message: 'This block has changes that haven\'t been saved.',
      confirmLabel: 'Discard',
      danger: true,
      onConfirm: () => { setConfirm(null); open(id); }
    });
  };

  // "✎ edit" clicked in the preview
  useEffect(() => {
    if (focusBlock) select(focusBlock.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusBlock]);

  const save = async () => {
    setBusy(true);
    try {
      const row = await saveBlock({ key: selected, content_md: content, path });
      setSaved(s => ({ ...s, [row.key]: row }));
      setDirty(false);
      const res = await revalidate([row.path]);
      if (res.skipped) {
        setNotice({ kind: 'ok', text: 'Saved (set SITE_URL and REVALIDATE_SECRET in admin/.env to refresh the site)' });
      } else {
        setNotice({ kind: 'ok', text: 'Saved — live on the site' });
        onSiteChanged(row.path);
      }
    } catch (err) {
      setNotice({ kind: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  // ⌘S / Ctrl+S saves the open block
  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && selected) {
        e.preventDefault();
        if (!busy && dirty) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="blocks-panel">
      <div className="blocks-list">
        <p className="muted">
          Editable text on <code>{path}</code>
          {!pageBlocks.length && ': none on this page.'}
        </p>
        {path === '/' && (
          <div className="projects-list">
            <div className="projects-heading">
              <span>Projects</span>
              <button className="primary" onClick={() => onOpenPost({ action: 'new', kind: 'project' })}>+ Add project</button>
            </div>
            {projects.map(p => (
              <button key={p.id} onClick={() => onOpenPost({ action: 'open', slug: p.slug })}>
                <span className="post-title">{p.title || 'Untitled'}</span>
                <span className={`badge ${p.status}`}>{p.status === 'published' ? 'public' : 'private'}</span>
              </button>
            ))}
            {!projects.length && <p className="muted">No project posts yet.</p>}
          </div>
        )}
        {pageBlocks.map(block => (
          <button key={block.id} className={block.id === selected ? 'selected' : ''} onClick={() => select(block.id)}>
            <span className="post-title">{block.label}</span>
            <span className={`badge ${saved[block.id] ? 'published' : ''}`}>{saved[block.id] ? 'edited' : 'default'}</span>
          </button>
        ))}
      </div>

      {selected ? (
        <>
          <RichEditor
            key={editorKey}
            markdown={content}
            onChange={md => { setContent(md); setDirty(true); setNotice(null); }}
            onUploadImage={uploadImage}
            onError={text => setNotice({ kind: 'error', text })}
          />
          <footer className="action-bar">
            <div className={`notice ${notice?.kind || ''}`} role="status">{notice?.text || (dirty ? 'Unsaved changes' : '')}</div>
            <div className="actions">
              <button className="primary" disabled={busy || !dirty} onClick={save}>Save</button>
            </div>
          </footer>
        </>
      ) : (
        <p className="muted blocks-hint">
          {notice ? <span className={`notice ${notice.kind}`}>{notice.text}</span> : 'Pick a block above, or hover text in the preview and click ✎ edit.'}
        </p>
      )}

      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
