create table if not exists public.saved_pills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pill_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, pill_id)
);

create index if not exists saved_pills_user_id_idx on public.saved_pills (user_id);

alter table public.saved_pills enable row level security;

drop policy if exists "Users read own pills" on public.saved_pills;
create policy "Users read own pills"
  on public.saved_pills for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own pills" on public.saved_pills;
create policy "Users insert own pills"
  on public.saved_pills for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own pills" on public.saved_pills;
create policy "Users delete own pills"
  on public.saved_pills for delete
  using (auth.uid() = user_id);
