import { useCallback, useEffect, useRef, useState } from 'react';
import { listPosts, savePost, deletePost, uploadImage, revalidate } from '../api';
import { splitFrontmatter } from '../markdown';
import RichEditor from './RichEditor';
import ConfirmDialog from './ConfirmDialog';
import ProjectDate from './ProjectDate';
import PostHistory from './PostHistory';
import { formatLongDate, openExternal } from '../site';

const slugify = text => text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// status 'published' = public on the site, 'draft' = private (only visible here).
// drafted_at / published_at are set and locked by the database, so switching visibility never
// moves a post in the blog. The project date is the editable one (logged in post_history).
const VISIBILITY = { published: 'public', draft: 'private' };
const KINDS = { blog: 'blog post', project: 'project' };

const emptyPost = () => ({
  id: null, slug: '', title: '', description: '', content_md: '', status: 'draft',
  kind: 'blog', project_date: null, project_date_precision: 'day'
});

// focusSlug: the post open in the site preview, so navigating there opens it here.
// onSiteChanged: called after the live site was refreshed, so the preview can reload.
export default function Workspace({ siteUrl, focusSlug, onSiteChanged = () => {} }) {
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
          if (!res.skipped) onSiteChanged(isLive ? `/blog/${row.slug}` : '/');
          flash('ok', res.skipped ? 'Saved (set SITE_URL and REVALIDATE_SECRET in admin/.env to refresh the site automatically)' : isLive ? 'Saved — live on the site' : 'Saved — removed from the site');
        } catch (err) {
          flash('error', `Saved, but the site didn't refresh: ${err.message}`);
        }
      } else {
        flash('ok', 'Saved — private');
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
        if (saved?.status === 'published') {
          await revalidate(['/', `/blog/${saved.slug}`]).then(() => onSiteChanged('/')).catch(() => {});
        }
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
    guard(() => load({
      ...emptyPost(),
      title,
      slug: slugify(data.slug || file.name.replace(/\.(md|markdown)$/i, '')),
      description: data.description || '',
      content_md: content.trim()
    }, { importedMarkdown: true }));
  };

  // open the post that's showing in the site preview
  useEffect(() => {
    if (!focusSlug || focusSlug === draft.slug) return;
    const post = posts.find(p => p.slug === focusSlug);
    if (post) guard(() => load(post));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSlug, posts]);

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
                {post.kind === 'project' && <span className="badge">project</span>}
                <span className={`badge ${post.status}`}>{VISIBILITY[post.status] || post.status}</span>
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
            <Toggle label="Kind" options={KINDS} value={draft.kind} onChange={kind => update({ kind })} />
            <div className="visibility" role="radiogroup" aria-label="Visibility">
              {Object.entries(VISIBILITY).map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={draft.status === status}
                  className={draft.status === status ? 'active' : ''}
                  onClick={() => draft.status !== status && update({ status })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {draft.kind === 'project' && (
            <ProjectDate value={draft.project_date} precision={draft.project_date_precision} onChange={update} />
          )}
          <p className="timestamps muted">
            {saved
              ? <>Drafted {formatLongDate(saved.drafted_at)} · {saved.published_at ? <>Published {formatLongDate(saved.published_at)}</> : 'never published'}</>
              : 'Not saved yet'}
          </p>
          <PostHistory postId={saved?.id} version={saved?.updated_at} />
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
            <button className="primary" disabled={busy || (saved && !dirty)} onClick={() => persist()}>
              {draft.status === 'published' ? 'Save · public' : 'Save · private'}
            </button>
          </div>
        </footer>
      </main>

      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

function Toggle({ label, options, value, onChange }) {
  return (
    <div className="visibility" role="radiogroup" aria-label={label}>
      {Object.entries(options).map(([key, text]) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} className={value === key ? 'active' : ''} onClick={() => value !== key && onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}
