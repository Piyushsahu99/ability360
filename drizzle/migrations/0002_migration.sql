ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS apply_url text;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_apply_url_https CHECK (apply_url IS NULL OR (apply_url ~ '^https://[^\s/]+\.[^\s]+$' AND length(apply_url) <= 500));
-- Original sample listings used fictional organisations; hide them so only real listings appear.
UPDATE public.opportunities SET is_published = false WHERE posted_by IS NULL;