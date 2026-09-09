# 🚀 Going live on https://tajgifts.netlify.app — exact steps

You chose **GitHub + Netlify**. Total time ≈ 10 minutes. Every future `git push` then redeploys automatically.

---

## 1 · Push this folder to GitHub (≈4 min)

1. On github.com → **New repository** → name `taj-gifts` → **Private** (recommended) → *Create* (do NOT tick README/gitignore/license).
2. In a terminal inside this folder (the unzipped one):

```bash
git init
git add .
git commit -m "Taj Gifts — full-stack hamper store (Next.js + Supabase)"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/taj-gifts.git
git push -u origin main
```

> ⚠️ `.env` is git-ignored on purpose — it holds your Supabase service-role key.
> If you ever see it in a commit: rotate the key in Supabase → Settings → API immediately.

## 2 · Connect the repo to your existing Netlify site (≈3 min)

1. app.netlify.com → pick the site that serves **tajgifts.netlify.app**
   (if you don't see one: *Add new site → Import an existing project → GitHub → taj-gifts*).
2. **Site configuration → Build & deploy → Continuous deployment → Connect** → choose your `taj-gifts` repo, branch `main`.
3. Build settings are read from `netlify.toml` automatically:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Netlify auto-installs the **Next.js runtime** plugin (server routes, middleware, ISR all work).
4. **Site configuration → Environment variables → Add variable**, add all five (values are in your local `.env` file):

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server-only) |
| `ADMIN_SECRET` | any long random string |
| `NEXT_PUBLIC_SITE_URL` | `https://tajgifts.netlify.app` |

5. Hit **Deploy site** (or push again). First build ≈ 3–5 min. Watch logs live in *Builds*.

## 3 · Point Supabase at the live domain (≈2 min)

Supabase dashboard → **Authentication → URL configuration**:
- **Site URL:** `https://tajgifts.netlify.app`
- **Redirect URLs — add:** `https://tajgifts.netlify.app/**`

(This makes login/confirmation/Google-OAuth redirects land on your real domain.)

## 4 · Verify live

- `https://tajgifts.netlify.app` → home renders
- `/shop`, any product, `/checkout` → working
- `/admin` → login with your admin password
- `/signup` → create an account, confirm email, see `/account`
- Place a ₹-test order with COD → appears in `/admin → Orders` → then cancel it

## 5 · Optional but recommended

- **Domain:** Netlify → *Domain management* → add `tajgifts.in` (or your domain) later; DNS via Netlify or your registrar; SSL auto.
- **Google login:** follow `GOOGLE-LOGIN-SETUP.md`, adding `https://tajgifts.netlify.app` as an authorized origin there too.
- **Accounts SQL:** if you haven't yet, run `supabase/migrations/0001_accounts.sql` in the Supabase SQL editor (one time).

---

### Updating the site later
Edit code → `git push` → Netlify rebuilds & swaps traffic atomically. Rollbacks: *Deploys → previous deploy → Publish*.
