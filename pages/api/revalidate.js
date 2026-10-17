import { timingSafeEqual } from 'crypto';

// Lets the local admin server refresh pages right after publishing. It can only re-render
// pages from what's already public in Supabase — it never changes content.
// Requires REVALIDATE_SECRET (same value in Vercel env and admin/.env).

// "/", "/some-page" or "/blog/some-post"
const PATH_PATTERN = /^\/((blog\/)?[a-z0-9]+(-[a-z0-9]+)*)?$/;

const secretMatches = provided => {
  const expected = process.env.REVALIDATE_SECRET || '';
  if (expected.length < 32 || typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!secretMatches(req.headers['x-revalidate-secret'])) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  const paths = Array.isArray(req.body?.paths) ? req.body.paths : [];
  if (!paths.length || paths.length > 10 || !paths.every(p => typeof p === 'string' && PATH_PATTERN.test(p))) {
    return res.status(400).json({ error: 'Body must be { paths: ["/", "/blog/my-slug"] }' });
  }

  try {
    await Promise.all(paths.map(p => res.revalidate(p)));
    return res.json({ revalidated: paths });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
