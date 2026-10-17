import marked from 'marked';
import hljs from 'highlight.js/lib/common';

// Markdown → HTML for posts and page blocks. Fenced code blocks get syntax colors by
// language (```java, ```js, ```python …) and a small language label; unknown or missing
// languages are auto-detected.
const escapeHtml = text => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const renderer = new marked.Renderer();
renderer.code = (code, infostring) => {
    const lang = (infostring || '').trim().split(/\s+/)[0].toLowerCase();
    const known = lang && hljs.getLanguage(lang);
    const result = known ? hljs.highlight(code, { language: lang, ignoreIllegals: true }) : hljs.highlightAuto(code);
    const label = known ? lang : result.language || '';
    return `<pre class="code-block"${label ? ` data-lang="${escapeHtml(label)}"` : ''}><code class="hljs${label ? ` language-${escapeHtml(label)}` : ''}">${result.value}</code></pre>\n`;
};

export const renderMarkdown = md => marked(md || '', { renderer });
