// Local-only admin server. Holds the Supabase service_role key (from admin/.env) and is the
// only thing that can write posts. The editor UI talks to it over /api; the key never reaches
// the browser/webview and nothing here is deployed to Vercel.
//
//   node server.mjs        serve the built UI (dist/) + API
//   node server.mjs --dev  same, with Vite hot reload for working on the UI

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DEV = process.argv.includes('--dev');

loadEnv(path.join(ROOT, '.env'));
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SITE_URL = '', REVALIDATE_SECRET = '' } = process.env;
const PORT = Number(process.env.ADMIN_PORT) || 4317;
const HOST = '127.0.0.1'; // never listen on the network
const ALLOWED_HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);
const BUCKET = 'post-images';
const FILES_BUCKET = 'site-files';
const RESUME_OBJECT = 'resume.pdf';
const POST_FIELDS = ['slug', 'title', 'description', 'content_md', 'status', 'published_at'];
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// --- Supabase (plain REST, no SDK) ---

// new-style secret keys (sb_secret_…) go in `apikey` only; legacy service_role JWTs also as a bearer token
const supabaseHeaders = () => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  ...(SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_') ? {} : { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` })
});

async function supabase(pathname, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}${pathname}`, {
    method,
    headers: { ...supabaseHeaders(), ...headers },
    body
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (data?.code === '23505') throw httpError(409, 'Another post already uses that slug');
    if (data?.code === 'PGRST205' || data?.code === '42P01') {
      throw httpError(500, 'The posts table is missing in this Supabase project. Run supabase/schema.sql in Dashboard → SQL Editor (and check SUPABASE_URL points at that project), then reload.');
    }
    throw httpError(res.status, data?.message || data?.error || `Supabase error ${res.status}`);
  }
  return data;
}

const COLUMNS = 'id,slug,title,description,content_md,status,published_at,updated_at';
const json = { 'Content-Type': 'application/json', Prefer: 'return=representation' };
const pickPostFields = body => Object.fromEntries(POST_FIELDS.filter(k => k in body).map(k => [k, body[k]]));
const isUuid = id => /^[0-9a-f-]{36}$/i.test(id);

const api = {
  'GET /api/health': async () => ({
    configured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
    siteUrl: SITE_URL.replace(/\/$/, ''),
    canRevalidate: Boolean(SITE_URL && REVALIDATE_SECRET)
  }),

  'GET /api/posts': () => supabase(`/rest/v1/posts?select=${COLUMNS}&order=updated_at.desc`),

  'POST /api/posts': async ({ body }) =>
    (await supabase(`/rest/v1/posts?select=${COLUMNS}`, { method: 'POST', headers: json, body: JSON.stringify(pickPostFields(body)) }))[0],

  'PATCH /api/posts/:id': async ({ id, body }) => {
    const rows = await supabase(`/rest/v1/posts?id=eq.${id}&select=${COLUMNS}`, { method: 'PATCH', headers: json, body: JSON.stringify(pickPostFields(body)) });
    if (!rows.length) throw httpError(404, 'Post not found');
    return rows[0];
  },

  'DELETE /api/posts/:id': async ({ id }) => {
    await supabase(`/rest/v1/posts?id=eq.${id}`, { method: 'DELETE' });
    return { deleted: id };
  },

  'POST /api/images': async ({ url, req }) => {
    const type = req.headers['content-type'] || '';
    if (!type.startsWith('image/')) throw httpError(400, 'Only images can be uploaded');
    const bytes = await readBody(req, MAX_IMAGE_BYTES);
    const name = (url.searchParams.get('name') || 'image').toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-80);
    const objectPath = `${new Date().toISOString().slice(0, 7)}/${Date.now()}-${name}`;
    await supabase(`/storage/v1/object/${BUCKET}/${objectPath}`, { method: 'POST', headers: { 'Content-Type': type }, body: bytes });
    return { url: `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${objectPath}` };
  },

  'GET /api/resume': async () => {
    const [file] = await supabase(`/storage/v1/object/list/${FILES_BUCKET}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', search: RESUME_OBJECT, limit: 1 })
    });
    return file?.name === RESUME_OBJECT
      ? { uploaded: true, updated_at: file.updated_at, size: file.metadata?.size ?? null }
      : { uploaded: false };
  },

  // replaces site-files/resume.pdf in place, so the site's /resume link never changes
  'POST /api/resume': async ({ req }) => {
    if (req.headers['content-type'] !== 'application/pdf') throw httpError(400, 'Only PDFs can be uploaded');
    const bytes = await readBody(req, MAX_IMAGE_BYTES);
    if (bytes.subarray(0, 5).toString() !== '%PDF-') throw httpError(400, "That file isn't a valid PDF");
    await supabase(`/storage/v1/object/${FILES_BUCKET}/${RESUME_OBJECT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf', 'x-upsert': 'true', 'cache-control': 'max-age=60' },
      body: bytes
    });
    return { uploaded: true, updated_at: new Date().toISOString(), size: bytes.length };
  },

  'POST /api/revalidate': async ({ body }) => {
    if (!SITE_URL || !REVALIDATE_SECRET) return { skipped: true };
    const res = await fetch(`${SITE_URL.replace(/\/$/, '')}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': REVALIDATE_SECRET },
      body: JSON.stringify({ paths: [...new Set(body.paths || [])] })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw httpError(502, data.error || `Site refresh failed (${res.status})`);
    return data;
  }
};

// --- HTTP plumbing ---

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) { reject(httpError(413, 'Too large')); req.destroy(); }
      else chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

// Other websites open in your browser can't use this server: the Host check stops DNS
// rebinding, and the required custom header can't be sent cross-origin without a CORS
// preflight, which this server never approves.
function isTrustedRequest(req) {
  if (!ALLOWED_HOSTS.has(req.headers.host)) return false;
  const origin = req.headers.origin;
  if (origin && !ALLOWED_HOSTS.has(origin.replace(/^https?:\/\//, ''))) return false;
  return req.headers['x-blog-admin'] === '1';
}

async function handleApi(req, res, url) {
  if (!isTrustedRequest(req)) return send(res, 403, { error: 'Forbidden' });

  const segments = url.pathname.split('/');
  const id = segments[3];
  const routeKey = id && segments.length === 4 ? `${req.method} /api/${segments[2]}/:id` : `${req.method} ${url.pathname}`;
  const route = api[routeKey];
  if (!route) return send(res, 404, { error: 'Not found' });
  if (id && !isUuid(id)) return send(res, 400, { error: 'Bad id' });

  try {
    if (routeKey !== 'GET /api/health' && !(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)) {
      throw httpError(500, 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in admin/.env');
    }
    const isJson = (req.headers['content-type'] || '').startsWith('application/json');
    const body = isJson ? JSON.parse((await readBody(req, 5 * 1024 * 1024)).toString() || '{}') : {};
    send(res, 200, await route({ req, url, id, body }));
  } catch (err) {
    send(res, err.status || 500, { error: err.message });
  }
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

function serveStatic(req, res, url) {
  const dist = path.join(ROOT, 'dist');
  let file = path.normalize(path.join(dist, decodeURIComponent(url.pathname)));
  if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(dist, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    return res.end('UI not built yet — run `npm run build` in admin/ (or use `npm run dev`)');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer();
let vite;

server.on('request', (req, res) => {
  if (!ALLOWED_HOSTS.has(req.headers.host)) {
    res.writeHead(403);
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  if (vite) return vite.middlewares(req, res);
  serveStatic(req, res, url);
});

if (DEV) {
  const { createServer } = await import('vite');
  vite = await createServer({ root: ROOT, server: { middlewareMode: true, hmr: { server } }, appType: 'spa' });
}

server.listen(PORT, HOST, () => {
  console.log(`Blog admin running at http://${HOST}:${PORT}${DEV ? ' (dev)' : ''}`);
});
