import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';

// Posts come from Supabase when it's configured, otherwise from the local posts/ folder
// (handy for local dev before the env vars are set).
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : null;

const POSTS_DIR = path.join(process.cwd(), 'posts');

// MM/DD/YYYY, matching the dates already used in the markdown frontmatter
const formatDate = iso => {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}/${d.getUTCFullYear()}`;
};

export async function getPostSlugs() {
  if (!supabase) {
    return fs.readdirSync(POSTS_DIR)
      .filter(filename => filename.endsWith('.md'))
      .map(filename => filename.replace('.md', ''));
  }

  const { data, error } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data.map(post => post.slug);
}

// returns { content, data: { title, description, date } } or null if it doesn't exist
export async function getPost(slug) {
  if (!supabase) {
    const file = path.join(POSTS_DIR, slug + '.md');
    if (!fs.existsSync(file)) return null;
    const parsed = matter(fs.readFileSync(file).toString());
    return { content: parsed.content, data: parsed.data };
  }

  const { data: post, error } = await supabase
    .from('posts')
    .select('title, description, content_md, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  if (!post) return null;

  return {
    content: post.content_md,
    data: {
      title: post.title,
      description: post.description,
      date: post.published_at ? formatDate(post.published_at) : ''
    }
  };
}
