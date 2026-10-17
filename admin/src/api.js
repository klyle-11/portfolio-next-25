// Talks to the local admin server (server.mjs), which holds the Supabase key.

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const isFile = body instanceof Blob;
  const res = await fetch(path, {
    method,
    headers: {
      'x-blog-admin': '1',
      ...(body && !isFile ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body && !isFile ? JSON.stringify(body) : body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const getHealth = () => request('/api/health');

export const listPosts = () => request('/api/posts');

export function savePost({ id, slug, title, description, content_md, status, published_at }) {
  const body = { slug, title, description, content_md, status, published_at };
  return id ? request(`/api/posts/${id}`, { method: 'PATCH', body }) : request('/api/posts', { method: 'POST', body });
}

export const deletePost = id => request(`/api/posts/${id}`, { method: 'DELETE' });

export async function uploadImage(file) {
  const { url } = await request(`/api/images?name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    body: file,
    headers: { 'Content-Type': file.type }
  });
  return url;
}

// Ask the live site to re-render these pages now instead of waiting for a redeploy.
export const revalidate = paths => request('/api/revalidate', { method: 'POST', body: { paths } });
