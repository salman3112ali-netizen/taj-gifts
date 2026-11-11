# Deploy Taj Gifts — the 5 commands

> **Read this first:** this is a **Next.js application**, not a static site. Drag-and-drop
> upload (Netlify Drop, or unzipping into the "Deploy manually" box) will publish files
> without running a build, and **every login, checkout, order, payment and admin route
> will 404**. You must deploy with a build step. The commands below do that.

---

## What you need

- **Node.js 22** on the machine you run this from (the project requires `>=22 <23`).
- A Netlify account with access to the existing `tajgifts.netlify.app` site.
- The environment variables already configured on that Netlify site (they persist
  across deploys — you do **not** need to re-enter them).

Check Node first:

```bash
node -v      # must print v22.x.x
```

If it prints v20 or v18, install Node 22 from <https://nodejs.org> before continuing.

---

## The commands

```bash
# 1 — unzip the release
unzip tajgifts-production-source-2026-09-09.zip -d tajgifts
cd tajgifts

# 2 — install dependencies (uses package-lock.json, so versions are locked)
npm ci

# 3 — install the Netlify CLI once
npm install -g netlify-cli

# 4 — log in and link this folder to the existing Taj Gifts site
netlify login
netlify link          # choose: "Link this directory to an existing site" → tajgifts

# 5 — build and publish to production
netlify deploy --build --prod
```

`--build` makes Netlify run `npm run build` (Next.js) and package the server routes
before publishing. That is the part drag-and-drop cannot do.

---

## Confirm the deploy actually worked

```bash
curl https://tajgifts.netlify.app/api/app/auth
```

It must answer:

```json
{"ok":true,"service":"Taj Gifts native account API"}
```

Then open these in a browser:

| URL | Expected |
|---|---|
| `https://tajgifts.netlify.app/` | Storefront loads with real products |
| `https://tajgifts.netlify.app/shop` | Product grid loads |
| `https://tajgifts.netlify.app/checkout` | Redirects to sign-in (no guest checkout) |
| `https://tajgifts.netlify.app/policies` | Policy page renders |
| `https://tajgifts.netlify.app/sitemap.xml` | XML sitemap renders |

If `/api/app/auth` returns **404**, the build step did not run — you deployed static
files. If it returns **503**, the environment variables are missing on that site.

---

## If you are creating a brand-new Netlify site instead

```bash
netlify sites:create --name tajgifts
netlify link
```

Then set the variables **before** deploying:

```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://peuoaooegxffecnwrzuv.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "<anon/publishable key from Supabase → Project Settings → API>"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "<service_role key — SERVER SECRET, never commit it>"
netlify env:set ADMIN_SECRET "$(openssl rand -base64 48)"
netlify env:set CUSTOMER_APP_TOKEN_SECRET "$(openssl rand -base64 48)"
netlify env:set DELIVERY_OTP_SECRET "$(openssl rand -base64 48)"
netlify env:set NEXT_PUBLIC_SITE_URL "https://<your-site>.netlify.app"

netlify deploy --build --prod
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public by design
(they ship to the browser). `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET`,
`CUSTOMER_APP_TOKEN_SECRET` and `DELIVERY_OTP_SECRET` are server secrets — never put
them in the ZIP, in Git, or in an APK.

**Updating an existing site?** Do not regenerate `ADMIN_SECRET`; reusing the current
value keeps existing owner sessions and delivery-code signatures valid.

---

## Optional: deploy from GitHub instead

1. Push the unzipped folder to a **private** GitHub repo (do not commit `.env`).
2. Netlify → **Site configuration → Build & deploy → Continuous deployment** → link
   the repo.
3. Netlify reads `netlify.toml` and uses `npm run build`, publish `.next`, Node 22.
4. Keep the same environment variables in **Site configuration → Environment variables**.

---

## After the deploy — the database is already done

All database hardening in this release is **already applied** to Supabase project
`peuoaooegxffecnwrzuv` (account-only checkout, refund-before-cancel, verified reviews,
placeholder-product archive, removal of unused image-AI secrets). You do **not** run
any SQL for this deploy.

Full details, acceptance tests and the owner checklist:
`PRODUCTION-RELEASE.md`, `RELEASE-VERIFICATION.md`, `SEO-OPERATIONS.md`.
