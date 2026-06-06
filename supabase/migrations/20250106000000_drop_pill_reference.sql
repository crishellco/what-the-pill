-- Pill identification uses Gemini only; remove unused reference catalog.

drop function if exists public.search_pills_by_embedding(vector, int, double precision);
drop function if exists public.search_pills_by_embedding(vector, int, float);
drop function if exists public.search_pills_by_imprint(text, text, text, int);
drop function if exists public.search_pills_by_description(text, int);

drop table if exists public.pill_image_embeddings cascade;
drop table if exists public.pill_reference cascade;
