import { useRef, useState } from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import { Markdown } from '@tiptap/markdown';
import { MarkdownPaste, MarkdownLinkInput } from '../markdown';

// syntax colors for code blocks, same highlight.js grammars and theme as the site
const lowlight = createLowlight(common);
const LANGUAGES = lowlight.listLanguages().sort();

// Rich text editing that reads and writes markdown. `markdown` is only the initial
// value — remount with a new `key` to load a different post.
export default function RichEditor({ markdown, onChange, onUploadImage, onError }) {
  const [mode, setMode] = useState('rich');
  const [source, setSource] = useState(markdown);
  const fileInput = useRef(null);
  const editorRef = useRef(null);

  const insertImages = async (files, pos) => {
    for (const file of files) {
      try {
        const src = await onUploadImage(file);
        const chain = editorRef.current.chain().focus();
        (pos == null ? chain : chain.setTextSelection(pos)).setImage({ src, alt: file.name.replace(/\.\w+$/, '') }).run();
      } catch (err) {
        onError(`Image upload failed: ${err.message}`);
      }
    }
  };

  const imageFiles = list => Array.from(list || []).filter(f => f.type.startsWith('image/'));

  const editor = useEditor({
    extensions: [
      // markdown has no underline syntax, so leave it out
      // typing ```java (or any language) + space/enter starts a highlighted code block
      StarterKit.configure({ underline: false, codeBlock: false, link: { openOnClick: false, autolink: true } }),
      CodeBlockLowlight.configure({ lowlight }),
      Image,
      Placeholder.configure({ placeholder: 'Write, paste markdown, or type ## for a heading…' }),
      Markdown,
      MarkdownPaste,
      MarkdownLinkInput
    ],
    content: markdown,
    contentType: 'markdown',
    editorProps: {
      handlePaste: (view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (!files.length) return false;
        insertImages(files);
        return true;
      },
      handleDrop: (view, event) => {
        const files = imageFiles(event.dataTransfer?.files);
        if (!files.length) return false;
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        insertImages(files, pos);
        return true;
      }
    },
    onCreate: ({ editor }) => { editorRef.current = editor; },
    onUpdate: ({ editor }) => onChange(editor.getMarkdown())
  });

  const switchMode = next => {
    if (next === mode) return;
    if (next === 'markdown') {
      setSource(editor.getMarkdown());
    } else {
      editor.commands.setContent(source, { contentType: 'markdown', emitUpdate: false });
    }
    setMode(next);
  };

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <div className="toolbar">
        {mode === 'rich' ? <FormatButtons editor={editor} onImage={() => fileInput.current.click()} /> : (
          <span className="toolbar-hint">Editing raw markdown</span>
        )}
        <div className="mode-switch" role="tablist">
          <button role="tab" aria-selected={mode === 'rich'} className={mode === 'rich' ? 'active' : ''} onClick={() => switchMode('rich')} title="Rich text">rtf</button>
          <button role="tab" aria-selected={mode === 'markdown'} className={mode === 'markdown' ? 'active' : ''} onClick={() => switchMode('markdown')} title="Markdown source">.md</button>
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={e => { insertImages(imageFiles(e.target.files)); e.target.value = ''; }}
      />

      {mode === 'rich' ? (
        <EditorContent editor={editor} className="prose" />
      ) : (
        <textarea
          className="markdown-source"
          value={source}
          spellCheck
          onChange={e => { setSource(e.target.value); onChange(e.target.value); }}
        />
      )}
    </div>
  );
}

function B({ active, label, title, onClick, disabled }) {
  return (
    <button className={active ? 'active' : ''} title={title} aria-label={title} aria-pressed={!!active} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

function FormatButtons({ editor, onImage }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState('');

  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      paragraph: editor.isActive('paragraph'),
      h1: editor.isActive('heading', { level: 1 }),
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      strike: editor.isActive('strike'),
      code: editor.isActive('code'),
      link: editor.isActive('link'),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
      codeBlock: editor.isActive('codeBlock'),
      codeLang: editor.isActive('codeBlock') ? editor.getAttributes('codeBlock').language || '' : null,
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo()
    })
  });

  const run = fn => () => fn(editor.chain().focus()).run();

  const openLink = () => {
    setHref(editor.getAttributes('link').href || '');
    setLinkOpen(true);
  };
  const applyLink = e => {
    e.preventDefault();
    const chain = editor.chain().focus().extendMarkRange('link');
    (href.trim() ? chain.setLink({ href: href.trim() }) : chain.unsetLink()).run();
    setLinkOpen(false);
  };

  return (
    <div className="format-buttons">
      <div className="group">
        <B label="¶" title="Paragraph" active={state.paragraph} onClick={run(c => c.setParagraph())} />
        <B label="H1" title="Heading 1 (# )" active={state.h1} onClick={run(c => c.toggleHeading({ level: 1 }))} />
        <B label="H2" title="Heading 2 (## )" active={state.h2} onClick={run(c => c.toggleHeading({ level: 2 }))} />
        <B label="H3" title="Heading 3 (### )" active={state.h3} onClick={run(c => c.toggleHeading({ level: 3 }))} />
      </div>
      <div className="group">
        <B label={<b>B</b>} title="Bold (⌘B / **text**)" active={state.bold} onClick={run(c => c.toggleBold())} />
        <B label={<i>I</i>} title="Italic (⌘I / *text*)" active={state.italic} onClick={run(c => c.toggleItalic())} />
        <B label={<s>S</s>} title="Strikethrough (~~text~~)" active={state.strike} onClick={run(c => c.toggleStrike())} />
        <B label={<code>{'<>'}</code>} title="Inline code (`code`)" active={state.code} onClick={run(c => c.toggleCode())} />
        <B label="🔗" title="Link ([text](url))" active={state.link} onClick={openLink} />
      </div>
      <div className="group">
        <B label="•" title="Bullet list (- )" active={state.bulletList} onClick={run(c => c.toggleBulletList())} />
        <B label="1." title="Numbered list (1. )" active={state.orderedList} onClick={run(c => c.toggleOrderedList())} />
        <B label="❝" title="Quote (> )" active={state.blockquote} onClick={run(c => c.toggleBlockquote())} />
        <B label="{ }" title="Code block (```java, ```js …)" active={state.codeBlock} onClick={run(c => c.toggleCodeBlock())} />
        {state.codeLang !== null && (
          <select
            className="code-lang"
            aria-label="Code language"
            value={state.codeLang}
            onChange={e => editor.chain().focus().updateAttributes('codeBlock', { language: e.target.value || null }).run()}
          >
            <option value="">auto</option>
            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
        )}
        <B label="―" title="Divider (---)" onClick={run(c => c.setHorizontalRule())} />
        <B label="🖼" title="Insert image (or paste / drop one)" onClick={onImage} />
      </div>
      <div className="group">
        <B label="↶" title="Undo" disabled={!state.canUndo} onClick={run(c => c.undo())} />
        <B label="↷" title="Redo" disabled={!state.canRedo} onClick={run(c => c.redo())} />
      </div>

      {linkOpen && (
        <form className="link-form" onSubmit={applyLink}>
          <input
            autoFocus
            type="url"
            placeholder="https://… (empty removes the link)"
            value={href}
            onChange={e => setHref(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setLinkOpen(false)}
          />
          <button type="submit">Apply</button>
          <button type="button" onClick={() => setLinkOpen(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
}
