# portfolio-next-25

Next.js portfolio and blog, deployed on Vercel. Blog posts live in Supabase and are written from a local-only admin editor (`admin/`).

## Quick start

```bash
npm install
npm run dev          # site at http://localhost:3000
```

With no Supabase env vars set, the site reads markdown from `posts/`, so it works out of the box.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server (http://localhost:3000) |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run migrate-posts` | One-off: copy `posts/*.md` into Supabase as published posts |
| `npm run admin:install` | Install the admin's dependencies (run once; needs Node 20.19+) |
| `npm run admin` | Admin editor in the browser at http://127.0.0.1:4317 (hot reload) |
| `npm run admin:build` then `npm run admin:start` | Admin using the built UI |
| `npm run admin:app` | Admin as a desktop window (Tauri dev; needs Rust) |
| `npm run admin:app:build` | Build an installable desktop app |
| `npm run build:admin:app` | Build the desktop app and install it: `/Applications` on macOS, Start menu on Windows (add `-- --no-install` to only build) |
| `npm run admin:startup` | Windows: start the desktop admin (dev) when you sign in |
| `npm run admin:startup:remove` | Windows: stop starting it on sign-in |
| `npm run admin:app:build:mac` | macOS: build just `Blog Admin.app` (no DMG) |
| `npm run admin:app:install:mac` | macOS: copy the built app into `/Applications` |
| `npm run admin:startup:mac` | macOS: start the desktop admin (dev) when you log in |
| `npm run admin:startup:mac:remove` | macOS: stop starting it on login |

## Blog setup (one time)

1. Create a Supabase project, then run `supabase/schema.sql` in Dashboard → SQL Editor.
2. Copy the project URL, the `anon` key and the `service_role` key (Project Settings → API Keys).
3. Generate a revalidate secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. In Vercel → Settings → Environment Variables, add `SUPABASE_URL`, `SUPABASE_ANON_KEY` (anon, **not** service) and `REVALIDATE_SECRET`, then redeploy.
5. Create the admin config: `cp admin/.env.example admin/.env` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL` (your Vercel URL) and the same `REVALIDATE_SECRET`.
6. Import the existing posts: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run migrate-posts`
7. For the site to show Supabase posts locally, put `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local` at the repo root.

## Writing posts (the admin)

```bash
npm run admin:install   # once
npm run admin           # open http://127.0.0.1:4317
```

The admin shows your site (live, or `localhost:3000`) with the editor docked on the right. Use **Sidebar / Half / Full / Hide** in the top bar to size it.

- **Page text:** hover any outlined text in the preview (bio, project blurbs) and click **✎ edit**. It saves to the `site_blocks` table and the page refreshes.
- **Posts:** each post is a **blog post** or a **project**, and **public** or **private**. Projects appear in the home page's Projects section with their project date, shown as `2026`, `October 2026` or `17 October 2026`.
- **Dates:** the database sets the drafted and first-published times and never changes them, so switching public/private never reorders the blog. The project date is editable. Every public/private switch and project date change is kept in an admin-only history under the post header.
- **Resume:** click the small ⤒ next to "resume" in the preview's header to upload a new PDF. `/resume` on the site always serves the latest one.
- **Code blocks:** type ````java` (or js, python, …) and press Enter for a syntax-colored block. In rtf mode, pick the language from the toolbar. Switch to `.md` to edit the raw markdown.

There is no login: the admin only listens on `127.0.0.1`, and the service key lives in `admin/.env` on your machine (gitignored, excluded from Vercel via `.vercelignore`). The public site only has the read-only anon key. Publishing calls `/api/revalidate` on the site, so changes go live immediately. Press Ctrl/Cmd+S to save. See [`admin/README.md`](admin/README.md) for the security model, editor shortcuts, images and the desktop app.

## Deploy

```bash
npx vercel --prod
```

## Troubleshooting

- **Site shows old posts:** `SUPABASE_URL`/`SUPABASE_ANON_KEY` aren't set for that environment, so it's falling back to `posts/`.
- **Publish doesn't update the live site:** check `SITE_URL` and `REVALIDATE_SECRET` in `admin/.env` match Vercel (secret must be 32+ chars).
- **Port in use:** set `ADMIN_PORT` in `admin/.env` (the desktop app expects 4317).
