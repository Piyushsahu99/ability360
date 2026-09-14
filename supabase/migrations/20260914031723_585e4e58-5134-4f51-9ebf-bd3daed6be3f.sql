DROP INDEX IF EXISTS public.resources_source_url_key;
CREATE UNIQUE INDEX resources_source_url_key ON public.resources (source_url);