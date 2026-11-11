# Taj Gifts native customer authentication — deployment note

For the current end-to-end release procedure, use **[`PRODUCTION-RELEASE.md`](./PRODUCTION-RELEASE.md)**. This note records the native-auth-specific requirements.

## Server deployment comes first

The native app requires the deployed Next.js routes, especially:

- `GET` / `POST` `/api/app/auth`
- `/api/app/account`
- `/api/app/orders`
- authenticated `/api/checkout`

Deploy the website source with a Node 22 Netlify build before installing/testing an Android APK. A static upload cannot create those API routes.

Production check:

```text
https://tajgifts.netlify.app/api/app/auth
```

It must return a JSON response with `"ok": true`. A 404 means the wrong deployment method was used; a 503 points to missing Netlify environment variables.

## Required configuration

1. In Netlify, set distinct server-only secrets:

   ```text
   CUSTOMER_APP_TOKEN_SECRET
   ADMIN_SECRET
   DELIVERY_OTP_SECRET
   ```

   Use random values of at least 32 characters. Never embed them in an Android app.

2. In Supabase **Authentication → URL Configuration**, add:

   ```text
   tajgifts://auth/callback
   ```

3. Set the normal site URL and `https://<canonical-domain>/auth/callback` redirect for browser authentication.

4. If Google is enabled, keep the standard Supabase callback in Google Cloud:

   ```text
   https://peuoaooegxffecnwrzuv.supabase.co/auth/v1/callback
   ```

   The Android custom scheme belongs in Supabase Redirect URLs, not as Google Cloud’s web callback.

## Expected security and user journey

- The app sends credentials over HTTPS to Taj’s native account endpoint; it does not save the password, Supabase refresh token, service key or admin key.
- The server exchanges successful authentication for a restricted Taj customer token.
- Android stores that token using Android Keystore protection and has backup disabled for the customer session.
- Email confirmation and optional Google OAuth return through `tajgifts://auth/callback`, so the customer returns to the native app rather than being stranded in the website.
- The server requires the customer identity for checkout even if an older client attempts a guest order.

## APK handling

No replacement APK is being generated in this source release. When the owner supplies their own APK, use that APK instead of any previously generated customer APK. Test that supplied APK only after the production endpoint above is healthy, using a real Android device for email sign-in, confirmation return, sign-out/reopen, address saving, signed-in checkout and order history.
