import { createClient } from '@supabase/supabase-js';

// Editable page text written from the admin. Returns { [key]: markdown } for the keys that
// have been saved; anything missing falls back to the text written in the component.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : null;

export async function getBlocks(keys) {
  if (!supabase) return {};
  const { data, error } = await supabase.from('site_blocks').select('key, content_md').in('key', keys);
  if (error) {
    // missing table etc. shouldn't take the page down, just use the built-in text
    console.warn('site_blocks unavailable:', error.message);
    return {};
  }
  return Object.fromEntries(data.map(row => [row.key, row.content_md]));
}
