-- Cached pill identification results (server-only via service role)
create table if not exists public.identify_cache (
  cache_key text primary key,
  mode text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists identify_cache_expires_at_idx on public.identify_cache (expires_at);

alter table public.identify_cache enable row level security;

-- Pharmaceutical reference terms (salt suffixes and brand names)
create table if not exists public.pharma_terms (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('salt', 'brand')),
  value text not null,
  source text not null default 'seed',
  created_at timestamptz not null default now(),
  unique (kind, value)
);

create index if not exists pharma_terms_kind_idx on public.pharma_terms (kind);

alter table public.pharma_terms enable row level security;

drop policy if exists "Anyone can read pharma terms" on public.pharma_terms;
create policy "Anyone can read pharma terms"
  on public.pharma_terms for select
  using (true);
