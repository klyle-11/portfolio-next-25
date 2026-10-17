# Blog Admin

Local-only editor for the portfolio blog. Write in rich text (or type/paste markdown), and it saves to Supabase as markdown. The site on Vercel reads published posts and updates the moment you publish.

## How it's locked down

```
 your machine                                   the internet
┌───────────────────────────────┐             ┌──────────────────────────┐
│ Blog Admin (Tauri or browser) │             │ Vercel site              │
│        │ /api (127.0.0.1)     │             │  anon key → read         │
│ server.mjs ── service key ────┼── write ──▶ │  published posts only    │
│  (admin/.env, never deployed) │             │  /api/revalidate needs   │
└───────────────────────────────┘             │  REVALIDATE_SECRET       │
                                              └──────────────────────────┘
```

- **Writes happen only from your machine.** The Supabase service key is read from `admin/.env` by `server.mjs` and never sent to the UI, the Tauri binary, git, or Vercel.
- **The live site can't write.** It only gets the anon key. Row-level security lets that key read published posts and nothing else, and write access is revoked from the anon role at the database level.
- **The admin server listens only on `127.0.0.1`.** Other sites open in your browser can't use it: it checks the Host and Origin headers and requires a custom header that browsers won't let other sites send.
- **The admin code never ships with the site.** `.vercelignore` excludes `admin/`, and nothing under `pages/` imports it.
- **`/api/revalidate` on the site can only refresh pages** from what's already public. It needs a 32+ character secret.

There's no login because nothing reachable from the internet can write.

## One-time setup

1. **Create a Supabase project** at supabase.com (the free tier is fine).
2. **Create the table:** open Dashboard → SQL Editor, paste `supabase/schema.sql`, and run it.
3. **Get your keys:** go to Dashboard → Project Settings → API Keys and copy the project URL, the `anon`/publishable key, and the `service_role`/secret key.
4. **Make a revalidate secret:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
5. **Vercel → Project → Settings → Environment Variables:**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (the anon key, **not** the service key)
   - `REVALIDATE_SECRET`

   Then redeploy.
6. **Local admin config:** `cp admin/.env.example admin/.env` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL` and `REVALIDATE_SECRET`.
7. **Move the existing posts** into Supabase (run from the repo root):
   ```sh
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run migrate-posts
   ```

Until `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set, the site keeps reading the `posts/` folder like before.

## Running it

```sh
cd admin
npm install

npm run dev        # browser at http://127.0.0.1:4317, hot reload for UI changes
npm start          # same, using the built UI (run `npm run build` first)

npm run app        # desktop window (Tauri dev mode)
npm run app:build  # build a desktop app you can keep in your dock / Start menu
```

The desktop app starts `server.mjs` from this folder itself, so keep the repo where it was when you built the app. Node also needs to be installed. Building the desktop app needs Rust plus the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

## Writing

- **Markdown shortcuts while typing:** `#`/`##`/`###` + space, `- `, `1. `, `> `, ` ``` `, `---`, `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``, `[text](url)`, `![alt](url)`
- **Paste markdown** and it turns into rich text. Pasting from web pages or Docs keeps their formatting.
- **Images:** paste, drag in, or use the toolbar button. They upload to the `post-images` bucket.
- **Markdown tab:** edit the raw markdown directly.
- **Import .md:** loads a markdown file, reading `title`, `description`, `date` and `slug` from its frontmatter.
- **⌘S / Ctrl+S** saves.
