-- Blog schema. Paste into Supabase dashboard → SQL Editor → Run. Safe to re-run.
--
-- Access model:
--   * the public site uses the anon key → can only SELECT published posts
--   * nothing can write except the service_role key, which lives only in admin/.env
--     on your own machine (service_role bypasses RLS; no write policies exist for anyone else)

create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null,
  description  text not null default '',
  content_md   text not null default '',
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists posts_published_idx on public.posts (status, published_at desc);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

drop policy if exists "published posts are public" on public.posts;
create policy "published posts are public" on public.posts
  for select to anon, authenticated using (status = 'published');

-- belt and braces: even if a write policy were added by mistake, these roles can't write
revoke insert, update, delete, truncate on public.posts from anon, authenticated;

-- Images uploaded from the editor: public read via URL, uploads only with the service_role key
-- (there are deliberately no insert/update/delete policies on storage.objects for this bucket).
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Files the admin replaces in place, like the resume (site-files/resume.pdf, served at /resume).
-- Public read, uploads only with the service_role key, PDFs only.
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('site-files', 'site-files', true, array['application/pdf'])
on conflict (id) do nothing;

-- tell the API layer about the new table right away (fixes "Could not find the table 'public.posts' in the schema cache")
notify pgrst, 'reload schema';
