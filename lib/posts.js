import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import { formatLongDate, formatProjectDate } from './dates';

// Posts come from Supabase when it's configured, otherwise from the local posts/ folder
// (handy for local dev before the env vars are set).
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : null;

const POSTS_DIR = path.join(process.cwd(), 'posts');

// Supabase is configured but supabase/schema.sql hasn't been run (or is out of date):
// keep building from the posts/ folder instead of failing the deploy.
const MISSING_SCHEMA = new Set(['PGRST205', '42P01', '42703', 'PGRST204']);
let warned = false;
const schemaMissing = error => {
  if (!error || !MISSING_SCHEMA.has(error.code)) return false;
  if (!warned) {
    console.warn(`Supabase posts table not ready (${error.message}), using the posts/ folder. Run supabase/schema.sql.`);
    warned = true;
  }
  return true;
};

const localSlugs = () => fs.readdirSync(POSTS_DIR)
  .filter(filename => filename.endsWith('.md'))
  .map(filename => filename.replace('.md', ''));

const localPost = slug => {
  const file = path.join(POSTS_DIR, slug + '.md');
  if (!fs.existsSync(file)) return null;
  const parsed = matter(fs.readFileSync(file).toString());
  return { content: parsed.content, data: parsed.data };
};

// every public post (blog posts and projects), for building /blog/[slug] pages
export async function getPostSlugs() {
  return getPostSlugsOfKind(null);
}

// slugs for the blog list on the home page: blog posts only, in the order they were first published
export async function getBlogSlugs() {
  return getPostSlugsOfKind('blog');
}

async function getPostSlugsOfKind(kind) {
  if (!supabase) return localSlugs();

  let query = supabase.from('posts').select('slug').eq('status', 'published');
  if (kind) query = query.eq('kind', kind);
  const { data, error } = await query.order('published_at', { ascending: false });
  if (schemaMissing(error)) return localSlugs();
  if (error) throw error;
  return data.map(post => post.slug);
}

// public project posts for the Projects section, newest project first
export async function getProjects() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('slug, title, description, project_date, project_date_precision')
    .eq('status', 'published')
    .eq('kind', 'project')
    .order('project_date', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false });
  if (schemaMissing(error)) return [];
  if (error) throw error;
  return data.map(p => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: formatProjectDate(p.project_date, p.project_date_precision)
  }));
}

// returns { content, data: { title, description, date } } or null if it doesn't exist
export async function getPost(slug) {
  if (!supabase) return localPost(slug);

  const { data: post, error } = await supabase
    .from('posts')
    .select('title, description, content_md, kind, published_at, project_date, project_date_precision')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (schemaMissing(error)) return localPost(slug);
  if (error) throw error;
  if (!post) return null;

  return {
    content: post.content_md,
    data: {
      title: post.title,
      description: post.description,
      date: post.kind === 'project'
        ? formatProjectDate(post.project_date, post.project_date_precision)
        : formatLongDate(post.published_at)
    }
  };
}
