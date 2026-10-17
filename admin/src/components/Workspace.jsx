import { useCallback, useEffect, useRef, useState } from 'react';
import { listPosts, savePost, deletePost, uploadImage, revalidate } from '../api';
import { splitFrontmatter } from '../markdown';
import RichEditor from './RichEditor';
import ConfirmDialog from './ConfirmDialog';

const slugify = text => text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const emptyPost = () => ({ id: null, slug: '', title: '', description: '', content_md: '', status: 'draft', published_at: null });

// <input type="date"> works in YYYY-MM-DD; store noon UTC so the date doesn't shift across timezones
const toDateInput = iso => (iso ? iso.slice(0, 10) : '');
const fromDateInput = value => (value ? `${value}T12:00:00.000Z` : null);

async function openExternal(url) {
  if (window.__TAURI_INTERNALS__) {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    return openUrl(url);
  }
  window.open(url, '_blank', 'noopener');
}

export default function Workspace({ siteUrl }) {
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState(emptyPost);
  const [saved, setSaved] = useState(null); // last saved version of the open post
  const [editorKey, setEditorKey] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { kind: 'ok' | 'error', text }
  const [confirm, setConfirm] = useState(null);
  const importInput = useRef(null);

  const flash = (kind, text) => setNotice({ kind, text });

  useEffect(() => {
    listPosts().then(setPosts).catch(err => flash('error', err.message));
  }, []);

  const load = (post, { importedMarkdown } = {}) => {
    setDraft(post);
    setSaved(post.id ? post : null);
    setSlugTouched(Boolean(post.id));
    setDirty(Boolean(importedMarkdown));
    setEditorKey(k => k + 1); // remount the editor with the new content
    setNotice(null);
  };

  // run `action` now, or after confirming that unsaved changes can be dropped
  const guard = action => {
    if (!dirty) return action();
    setConfirm({
      title: 'Discard unsaved changes?',
      message: `"${draft.title || 'Untitled'}" has changes that haven't been saved.`,
      confirmLabel: 'Discard',
      danger: true,
      onConfirm: () => { setConfirm(null); action(); }
    });
  };

  const update = fields => {
    setDraft(d => {
      const next = { ...d, ...fields };
      if ('title' in fields && !slugTouched) next.slug = slugify(fields.title);
      return next;
    });
    markDirty();
  };

  const markDirty = () => {
    setDirty(true);
    setNotice(null);
  };

  const persist = useCallback(async overrides => {
    const next = { ...draft, ...overrides };
    if (!next.title.trim()) return flash('error', 'Add a title first');
    if (!next.slug) return flash('error', 'Add a slug (the URL part, like my-first-post)');
    if (next.status === 'published' && !next.published_at) next.published_at = new Date().toISOString();

    setBusy(true);
    try {
      const row = await savePost(next);
      setPosts(list => [row, ...list.filter(p => p.id !== row.id)]);
      setDraft(row);
      setSaved(row);
      setDirty(false);
      setSlugTouched(true);

      // refresh the site when anything public changed: a published post, or one that just left /blog
      const wasLive = saved?.status === 'published';
      const isLive = row.status === 'published';
      if (wasLive || isLive) {
        const paths = ['/', `/blog/${row.slug}`];
        if (wasLive && saved.slug !== row.slug) paths.push(`/blog/${saved.slug}`);
        try {
          const res = await revalidate(paths);
          flash('ok', res.skipped ? 'Saved (set SITE_URL and REVALIDATE_SECRET in admin/.env to refresh the site automatically)' : isLive ? 'Saved — live on the site' : 'Saved — removed from the site');
        } catch (err) {
          flash('error', `Saved, but the site didn't refresh: ${err.message}`);
        }
      } else {
        flash('ok', 'Draft saved');
      }
    } catch (err) {
      flash('error', err.message);
    } finally {
      setBusy(false);
    }
  }, [draft, saved]);

  const remove = () => setConfirm({
    title: 'Delete this post?',
    message: `"${draft.title || 'Untitled'}" will be permanently deleted${saved?.status === 'published' ? ' and taken off the site' : ''}.`,
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: async () => {
      setConfirm(null);
      setBusy(true);
      try {
        await deletePost(draft.id);
        if (saved?.status === 'published') await revalidate(['/', `/blog/${saved.slug}`]).catch(() => {});
        setPosts(list => list.filter(p => p.id !== draft.id));
        load(emptyPost());
        flash('ok', 'Post deleted');
      } catch (err) {
        flash('error', err.message);
      } finally {
        setBusy(false);
      }
    }
  });

  const importMarkdown = async file => {
    const { data, content } = splitFrontmatter(await file.text());
    const title = data.title || file.name.replace(/\.(md|markdown)$/i, '');
    const date = data.date ? new Date(data.date) : null;
    guard(() => load({
      ...emptyPost(),
      title,
      slug: slugify(data.slug || file.name.replace(/\.(md|markdown)$/i, '')),
      description: data.description || '',
      content_md: content.trim(),
      published_at: date && !isNaN(date) ? date.toISOString() : null
    }, { importedMarkdown: true }));
  };

  // ⌘S / Ctrl+S saves
  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!busy) persist();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [persist, busy]);

  const isPublished = saved?.status === 'published';

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="sidebar-actions">
          <button className="primary" onClick={() => guard(() => load(emptyPost()))}>+ New post</button>
          <button title="Import a .md file" onClick={() => importInput.current.click()}>Import .md</button>
          <input
            ref={importInput}
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            hidden
            onChange={e => { if (e.target.files[0]) importMarkdown(e.target.files[0]); e.target.value = ''; }}
          />
        </div>
        <ul className="post-list">
          {posts.map(post => (
            <li key={post.id}>
              <button className={post.id === draft.id ? 'selected' : ''} onClick={() => post.id !== draft.id && guard(() => load(post))}>
                <span className="post-title">{post.title || 'Untitled'}</span>
                <span className={`badge ${post.status}`}>{post.status}</span>
              </button>
            </li>
          ))}
          {!posts.length && <li className="muted empty">No posts yet</li>}
        </ul>
      </aside>

      <main className="editor-pane">
        <header className="post-header">
          <input
            className="title-input"
            placeholder="Post title"
            value={draft.title}
            onChange={e => update({ title: e.target.value })}
          />
          <div className="meta-row">
            <label>
              <span>/blog/</span>
              <input
                value={draft.slug}
                placeholder="post-url"
                onChange={e => { setSlugTouched(true); update({ slug: slugify(e.target.value) }); }}
              />
            </label>
            <label>
              <span>Date</span>
              <input type="date" value={toDateInput(draft.published_at)} onChange={e => update({ published_at: fromDateInput(e.target.value) })} />
            </label>
          </div>
          <input
            className="description-input"
            placeholder="Short description (used for the page's meta description)"
            value={draft.description}
            onChange={e => update({ description: e.target.value })}
          />
        </header>

        <RichEditor
          key={editorKey}
          markdown={draft.content_md}
          onChange={content_md => { setDraft(d => ({ ...d, content_md })); markDirty(); }}
          onUploadImage={uploadImage}
          onError={text => flash('error', text)}
        />

        <footer className="action-bar">
          <div className={`notice ${notice?.kind || ''}`} role="status">
            {notice?.text || (dirty ? 'Unsaved changes' : saved ? `Saved ${new Date(saved.updated_at).toLocaleString()}` : '')}
          </div>
          <div className="actions">
            {draft.id && <button className="danger-text" disabled={busy} onClick={remove}>Delete</button>}
            {isPublished && siteUrl && (
              <button disabled={busy} onClick={() => openExternal(`${siteUrl}/blog/${saved.slug}`)}>View on site ↗</button>
            )}
            {isPublished ? (
              <>
                <button disabled={busy} onClick={() => persist({ status: 'draft' })}>Unpublish</button>
                <button className="primary" disabled={busy || !dirty} onClick={() => persist()}>Update</button>
              </>
            ) : (
              <>
                <button disabled={busy} onClick={() => persist({ status: 'draft' })}>Save draft</button>
                <button className="primary" disabled={busy} onClick={() => persist({ status: 'published' })}>Publish</button>
              </>
            )}
          </div>
        </footer>
      </main>

      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
