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
