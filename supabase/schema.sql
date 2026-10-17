-- Blog schema. Paste into Supabase dashboard → SQL Editor → Run. Safe to re-run.
--
-- Access model:
--   * the public site uses the anon key → can only SELECT published posts
--   * nothing can write except the service_role key, which lives only in admin/.env
--     on your own machine (service_role bypasses RLS; no write policies exist for anyone else)

-- Posts: blog posts and project write-ups (kind). Dates kept as separate facts:
--   drafted_at        when the post was first saved                      — set by the database, never changes
--   published_at      the first time it was made public                  — set by the database, never changes,
--                     so toggling public/private keeps its place in the blog
--   status            'published' = public, 'draft' = private            — every change is logged
--   project_date (+ project_date_precision 'year' | 'month' | 'day')
--                     when the project happened, shown as "2026", "October 2026" or "17 October 2026"
--                     — editable, every change is logged
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

alter table public.posts add column if not exists kind text not null default 'blog' check (kind in ('blog', 'project'));
alter table public.posts add column if not exists drafted_at timestamptz not null default now();
alter table public.posts add column if not exists project_date date;
alter table public.posts add column if not exists project_date_precision text not null default 'day'
  check (project_date_precision in ('year', 'month', 'day'));

create index if not exists posts_published_idx on public.posts (status, published_at desc);
create index if not exists posts_kind_idx on public.posts (kind, status);

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

-- drafted_at / published_at are facts, not settings: whatever a client sends is ignored.
-- (On insert an explicit published_at is kept, so migrate-posts can carry over old post dates.)
create or replace function public.lock_post_timestamps() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'published' then
      new.published_at = coalesce(new.published_at, now());
      new.drafted_at = new.published_at;
    else
      new.published_at = null;
      new.drafted_at = now();
    end if;
  else
    new.drafted_at = old.drafted_at;
    new.published_at = coalesce(old.published_at, case when new.status = 'published' then now() end);
  end if;
  -- trim the project date to the precision it's shown at
  if new.project_date is not null then
    new.project_date = case new.project_date_precision
      when 'year'  then date_trunc('year', new.project_date)::date
      when 'month' then date_trunc('month', new.project_date)::date
      else new.project_date end;
  end if;
  return new;
end $$;

drop trigger if exists posts_lock_timestamps on public.posts;
create trigger posts_lock_timestamps before insert or update on public.posts
  for each row execute function public.lock_post_timestamps();

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

-- Editable text blocks on site pages (bio, project blurbs…), keyed like "home.bio".
-- Same access model as posts: anyone can read, only the service_role key can write.
create table if not exists public.site_blocks (
  key         text primary key check (key ~ '^[a-z0-9]+([.-][a-z0-9]+)*$'),
  content_md  text not null default '',
  path        text not null default '/',
  updated_at  timestamptz not null default now()
);

drop trigger if exists site_blocks_touch_updated_at on public.site_blocks;
create trigger site_blocks_touch_updated_at before update on public.site_blocks
  for each row execute function public.touch_updated_at();

alter table public.site_blocks enable row level security;

drop policy if exists "site blocks are public" on public.site_blocks;
create policy "site blocks are public" on public.site_blocks
  for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on public.site_blocks from anon, authenticated;

-- Admin-only log of each post: when it was drafted, every public/private switch and every
-- project date it has had. Written by the database itself, so no client can skip it.
-- No policies, so only the service_role key (the local admin) can read it.
drop table if exists public.post_date_history;
drop function if exists public.log_post_date();

create table if not exists public.post_history (
  id         bigint generated always as identity primary key,
  post_id    uuid not null references public.posts (id) on delete cascade,
  event      text not null check (event in ('drafted', 'made_public', 'made_private', 'project_date')),
  old_value  text,
  new_value  text,
  changed_at timestamptz not null default now()
);

create index if not exists post_history_post_idx on public.post_history (post_id, changed_at desc);

alter table public.post_history enable row level security;
revoke all on public.post_history from anon, authenticated;

create or replace function public.log_post_history() returns trigger
language plpgsql set search_path = '' as $$
declare
  old_date text;
  new_date text := case when new.project_date is not null then new.project_date || ' ' || new.project_date_precision end;
begin
  if tg_op = 'INSERT' then
    insert into public.post_history (post_id, event, new_value) values (new.id, 'drafted', new.status);
    if new.status = 'published' then
      insert into public.post_history (post_id, event, new_value) values (new.id, 'made_public', null);
    end if;
    if new_date is not null then
      insert into public.post_history (post_id, event, new_value) values (new.id, 'project_date', new_date);
    end if;
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.post_history (post_id, event)
    values (new.id, case when new.status = 'published' then 'made_public' else 'made_private' end);
  end if;

  old_date := case when old.project_date is not null then old.project_date || ' ' || old.project_date_precision end;
  if old_date is distinct from new_date then
    insert into public.post_history (post_id, event, old_value, new_value) values (new.id, 'project_date', old_date, new_date);
  end if;
  return new;
end $$;

drop trigger if exists posts_log_history on public.posts;
create trigger posts_log_history after insert or update on public.posts
  for each row execute function public.log_post_history();

-- tell the API layer about the new tables right away (fixes "Could not find the table 'public.posts' in the schema cache")
notify pgrst, 'reload schema';
