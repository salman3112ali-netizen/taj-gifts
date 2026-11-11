-- CRITICAL credential exposure fix.
--
-- public.settings stored the admin password hash and the integration-key vault
-- (SMTP app password, Telegram bot token, Meta/Razorpay credentials) in a single
-- JSONB column. The `settings_public_read` RLS policy allowed ANY holder of the
-- site's public anon key — which ships in the browser bundle by design — to read
-- the entire row through PostgREST. Verified exploitable: anon could read
-- data.apis.smtpPass and data.adminPasswordHash.
--
-- Every server path reads settings through the service-role client, which bypasses
-- RLS, and no browser code queries this table. Removing the policy and the table
-- grants therefore closes the leak with no change in application behaviour.

drop policy if exists settings_public_read on public.settings;
revoke select, insert, update, delete on table public.settings from anon, authenticated;

-- Catalogue imagery is written only by the owner console through
-- /api/admin/upload (service role). The customer-facing write policy let any
-- registered account push arbitrary files into the public products bucket.
drop policy if exists products_images_authed_write on storage.objects;
revoke insert, update, delete on table storage.objects from anon, authenticated;
