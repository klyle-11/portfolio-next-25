import { Extension, InputRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// Plain text that looks like markdown: headings, lists, quotes, fences, bold, links, images
const MARKDOWN_HINT = /(^|\n) {0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|---\s*$)|\*\*[^*\n]+\*\*|~~[^~\n]+~~|`[^`\n]+`|!?\[[^\]\n]+\]\([^)\s]+\)/;

// Parse markdown into editor content. A single paragraph is inserted inline so
// pasting "**bold** text" mid-sentence doesn't split the paragraph.
export function markdownToContent(editor, markdown) {
  const blocks = editor.markdown.parse(markdown).content || [];
  return blocks.length === 1 && blocks[0].type === 'paragraph' ? blocks[0].content || [] : blocks;
}

// Pasting markdown text renders it as rich text. Rich clipboard content (from a browser,
// Word, Google Docs) is left to the normal HTML paste, except from code editors like
// VS Code, whose HTML is just syntax highlighting.
export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste(view, event) {
            const clipboard = event.clipboardData;
            if (!clipboard || editor.isActive('codeBlock')) return false;
            const text = clipboard.getData('text/plain');
            const html = clipboard.getData('text/html');
            const fromCodeEditor = clipboard.types.includes('vscode-editor-data');
            if (!text || (html && !fromCodeEditor) || !MARKDOWN_HINT.test(text)) return false;
            return editor.commands.insertContent(markdownToContent(editor, text));
          }
        }
      })
    ];
  }
});

// Typing [text](https://url) turns into a link (StarterKit already covers **bold**, ## headings, - lists, etc.)
export const MarkdownLinkInput = Extension.create({
  name: 'markdownLinkInput',

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|[^!])\[([^\]]+)\]\(([^)\s]+)\)$/,
        handler: ({ state, range, match, chain }) => {
          const [full, text, href] = match;
          const start = range.from + (full.startsWith('[') ? 0 : 1);
          const linkMark = state.schema.marks.link.create({ href });
          chain()
            .deleteRange({ from: start, to: range.to })
            .insertContentAt(start, { type: 'text', text, marks: [linkMark.toJSON()] })
            .unsetMark('link')
            .run();
        }
      })
    ];
  }
});

// Minimal frontmatter reader for importing .md files (title/description/date/slug)
export function splitFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, content: source };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { data, content: source.slice(match[0].length) };
}
