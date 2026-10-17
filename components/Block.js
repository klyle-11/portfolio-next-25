import { renderMarkdown } from '../lib/markdown';

// A piece of page text the admin can edit. `md` comes from Supabase (via getBlocks);
// `fallback` is the markdown used until it's been edited once.
export default function Block({ id, label, md, fallback, className }) {
    const source = md ?? fallback;
    if (typeof window !== 'undefined') {
        (window.__siteBlocks ||= {})[id] = { label, md: source };
    }
    return (
        <div
            className={className}
            data-block={id}
            data-block-label={label}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
        />
    );
}
