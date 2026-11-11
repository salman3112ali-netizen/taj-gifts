-- Synthetic hamper imagery is no longer part of customer or owner flows. Remove
-- now-unused image-model credentials from the settings JSON while preserving all
-- active notification, payment and storefront configuration.

update public.settings
set data = jsonb_set(
  data,
  '{apis}',
  coalesce(data->'apis', '{}'::jsonb)
    - 'geminiKey'
    - 'geminiModel'
    - 'openaiKey'
    - 'openaiModel',
  true
),
updated_at = now()
where id = 'shop'
  and data ? 'apis';
