-- Identification uses Gemini on every request; cache no longer needed.

drop table if exists public.identify_cache cascade;
