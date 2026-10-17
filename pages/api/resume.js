// /resume → the latest resume uploaded from the admin (Supabase storage, site-files/resume.pdf).
// Falls back to the PDF bundled in public/ when Supabase isn't configured or nothing is uploaded yet.

const FALLBACK = '/resume925.pdf';

export default async function handler(req, res) {
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const fileUrl = `${base}/storage/v1/object/public/site-files/resume.pdf`;

  let target = FALLBACK;
  if (base) {
    try {
      const head = await fetch(fileUrl, { method: 'HEAD' });
      if (head.ok) target = `${fileUrl}?v=${encodeURIComponent(head.headers.get('etag') || '')}`;
    } catch {
      // storage unreachable, use the bundled copy
    }
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.redirect(302, target);
}
