-- Rode este arquivo uma vez no Supabase: SQL Editor › New query › Run.
-- Guarda os dados do app de cada pessoa em uma linha (JSON), protegida por login.

create table if not exists public.app_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

-- se você rodar este script de novo, apaga as regras antigas antes de recriar
drop policy if exists "ler os proprios dados" on public.app_data;
drop policy if exists "criar os proprios dados" on public.app_data;
drop policy if exists "atualizar os proprios dados" on public.app_data;

-- cada pessoa só enxerga e altera os próprios dados
create policy "ler os proprios dados"
  on public.app_data for select
  using (auth.uid() = user_id);

create policy "criar os proprios dados"
  on public.app_data for insert
  with check (auth.uid() = user_id);

create policy "atualizar os proprios dados"
  on public.app_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
