# Creations gallery — setup

The **View creations** page (`/creations`), the submission form, the **likes**, and the
**admin panel** (`/admin`) all run client-side against two free services:

- **Cloudinary** — hosts the uploaded images (on its CDN, not on your site).
- **Supabase** — Postgres database + auth for submissions, likes and moderation.

No server / build step. You just paste 4 public values into `config.js`. Until you do,
the gallery shows a friendly "not connected yet" notice instead of breaking.

> Security model: the Supabase **anon key** and the Cloudinary **unsigned preset** are
> *meant* to be public. Your data is protected by the Row-Level Security (RLS) policies
> below, not by hiding keys. Don't put any *secret* keys in `config.js`.

---

## 1. Cloudinary (image hosting)

1. Create a free account at <https://cloudinary.com>.
2. Dashboard → copy your **Cloud name**.
3. **Settings → Upload → Upload presets → Add upload preset**:
   - **Signing Mode: Unsigned**
   - (optional) set a **folder** like `creations` to keep things tidy.
   - Save and copy the **preset name**.
4. Put both into `config.js`:
   ```js
   export const CLOUDINARY = {
     cloudName:    "your-cloud-name",
     uploadPreset: "your-unsigned-preset",
   };
   ```

---

## 2. Supabase (database + admin auth)

1. Create a free project at <https://supabase.com>.
2. **Project Settings → API**: copy the **Project URL** and the **anon / public** key
   into `config.js`:
   ```js
   export const SUPABASE = {
     url:     "https://xxxx.supabase.co",
     anonKey: "eyJ...your-anon-key...",
   };
   ```
3. **SQL Editor → New query**, paste everything below, and **Run**:

   ```sql
   -- Creations -----------------------------------------------------------------
   create table public.creations (
     id          uuid primary key default gen_random_uuid(),
     created_at  timestamptz not null default now(),
     artist      text not null,
     title       text,
     social_url  text not null,
     image_url   text not null,
     status      text not null default 'pending' check (status in ('pending','approved')),
     likes       integer not null default 0
   );
   alter table public.creations enable row level security;

   -- anyone may submit, but only as 'pending'
   create policy "public submits pending" on public.creations
     for insert to anon with check (status = 'pending');
   -- the public gallery only ever sees approved rows
   create policy "public reads approved" on public.creations
     for select to anon using (status = 'approved');
   -- you (logged in) can see and moderate everything
   create policy "admin reads all" on public.creations
     for select to authenticated using (true);
   create policy "admin updates"   on public.creations
     for update to authenticated using (true) with check (true);
   create policy "admin deletes"   on public.creations
     for delete to authenticated using (true);

   -- Likes (one per browser, enforced by the unique constraint) ----------------
   create table public.likes (
     id          uuid primary key default gen_random_uuid(),
     creation_id uuid not null references public.creations(id) on delete cascade,
     voter_id    text not null,
     created_at  timestamptz not null default now(),
     unique (creation_id, voter_id)
   );
   alter table public.likes enable row level security;
   create policy "anyone reads likes"   on public.likes for select to anon, authenticated using (true);
   create policy "anyone can like"       on public.likes for insert to anon, authenticated with check (true);
   create policy "anyone removes a like" on public.likes for delete to anon, authenticated using (true);

   -- Keep creations.likes in sync (runs as owner, so it bypasses RLS) ----------
   create or replace function public.sync_creation_likes()
   returns trigger
   language plpgsql
   security definer
   set search_path = public
   as $$
   begin
     if (tg_op = 'INSERT') then
       update public.creations set likes = likes + 1 where id = new.creation_id;
     elsif (tg_op = 'DELETE') then
       update public.creations set likes = greatest(0, likes - 1) where id = old.creation_id;
     end if;
     return null;
   end;
   $$;

   create trigger trg_sync_creation_likes
     after insert or delete on public.likes
     for each row execute function public.sync_creation_likes();
   ```

4. Create **your** admin login: **Authentication → Users → Add user** (email + password,
   tick *Auto Confirm*). That email/password is what you'll use at `/admin`.

5. **Important — lock the door:** **Authentication → Providers → Email** (or
   *Sign In / Up → Settings*) and **turn OFF "Allow new users to sign up"**. Otherwise
   anyone could create an account. You added yourself manually in step 4, so you don't
   need public sign-ups.

---

## 3. Use it

- `/creations` — public gallery (most-liked first) + **Submit your creation** form +
  per-creation **like** buttons (one like per browser, toggleable).
- `/admin` — log in with the user from step 4. **Pending** tab shows new submissions with
  Approve / Reject; **Approved** tab lets you Unpublish or Delete.

New submissions land as `pending` and only appear in the gallery once you approve them.

---

## 4. Fonts

Nothing to do — the title/branding uses **Handjet** and body text uses **Fresca**, both
pulled from **Google Fonts** via a `<link>` in each page's `<head>` (DM Sans is the
fallback). No files to host.

---

## Local testing

It's still a static site — serve over HTTP (ES modules need it):

```bash
python3 -m http.server 5173
# http://localhost:5173/            generator
# http://localhost:5173/creations   gallery + submit
# http://localhost:5173/admin       moderation
```

Add `http://localhost:5173` under **Supabase → Authentication → URL Configuration**
(redirect URLs / site URL) if you hit auth issues locally; your Vercel domain should be
there for production.
