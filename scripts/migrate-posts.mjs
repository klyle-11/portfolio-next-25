// One-off: copy posts/*.md into the Supabase posts table (as published posts).
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-posts.mjs
//
// The service role key can write everything — keep it out of the repo and out of Vercel.
// Re-running updates existing rows (matched by slug).

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const dir = path.join(process.cwd(), 'posts');
const rows = fs.readdirSync(dir)
  .filter(f => f.endsWith('.md'))
  .map(f => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
    const date = data.date ? new Date(data.date) : new Date();
    return {
      slug: f.replace('.md', '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      title: data.title || f.replace('.md', ''),
      description: data.description || '',
      content_md: content.trim(),
      status: 'published',
      published_at: isNaN(date) ? new Date().toISOString() : date.toISOString()
    };
  });

const { error } = await supabase.from('posts').upsert(rows, { onConflict: 'slug' });
if (error) throw error;
console.log(`Migrated ${rows.length} posts: ${rows.map(r => r.slug).join(', ')}`);
