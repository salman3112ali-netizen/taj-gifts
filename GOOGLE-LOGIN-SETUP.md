# 🔑 Switch on "Continue with Google" — 6 minutes, one time

The button, callback route and session handling are **already built into the site**.
Google sign-in needs two paste-jobs (Google → Supabase). Nothing else.

---

## Step 1 — Google Cloud Console (≈4 min)

1. Open https://console.cloud.google.com → sign in with the Google account that should own login.
2. Create a project: name it `Taj Gifts` (top bar → *New Project*).
3. Left menu → **APIs & Services → OAuth consent screen**
   - User type: **External** → Create.
   - App name: `Taj Gifts`, support email: your email, developer contact: your email. Save & continue (scopes page: just continue; test users page: continue).
4. Left menu → **APIs & Services → Credentials** → **+ Create credentials → OAuth client ID**
   - Application type: **Web application**.
   - Name: `Taj Gifts Web`.
   - **Authorized JavaScript origins** (add each):
     - `http://localhost:3000`
     - your preview URL origin, e.g. `https://3000-<yoursandbox>.e2b.app`
     - your live domain, e.g. `https://tajgifts.in`
   - **Authorized redirect URIs** (add each — this is the one people forget):
     - `https://peuoaooegxffecnwrzuv.supabase.co/auth/v1/callback`
   - Create → a box shows **Client ID** (`….apps.googleusercontent.com`) and **Client secret**. Copy both.

## Step 2 — Supabase dashboard (≈1 min)

1. Open https://supabase.com/dashboard → your project → **Authentication → Sign-in / Providers → Google**.
2. Enable it, paste the **Client ID** and **Client secret**, Save.
3. Still in **Authentication → URL configuration**:
   - **Site URL**: your live domain (`https://tajgifts.in`) — or the preview URL while testing.
   - **Redirect URLs** (allow-list, add all you use):
     - `http://localhost:3000/**`
     - `https://3000-<yoursandbox>.e2b.app/**`
     - `https://tajgifts.in/**`

## Step 3 — try it

Reload `/login` → **Continue with Google** → pick your account → you land on `/account`, signed in, with a profile row auto-created by the database trigger.

---

### If the button shows an error instead
| Message | Fix |
|---|---|
| "Provider not enabled" | Step 2 not saved yet |
| "redirect_uri_mismatch" (Google screen) | The `auth/v1/callback` redirect URI is missing/typo'd in Step 1.4 |
| "Access blocked / app unverified" (Google screen) | Normal while the consent screen is in *Testing* — add your own email under *Test users*, or publish the app |
| Ends at `/login?error=oauth_failed` | Redirect allow-list in Step 2.3 missing your current origin |

### While testing without a domain
Google requires the consent screen's app to be in *Testing* or *Production*; in Testing, only **test users** you list can sign in — add yourself and family emails there until you publish.
