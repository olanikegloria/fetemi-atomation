-- Run in Supabase SQL Editor (Dashboard → SQL → New query).
-- Stores manager + content creator emails. Store emails lowercase.

-- ── Managers ─────────────────────────────────────────────────────────────
create table if not exists public.managers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_managers_email_lower on public.managers (lower(email));

-- ── Content creators ─────────────────────────────────────────────────────
create table if not exists public.content_creators (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_content_creators_email_lower on public.content_creators (lower(email));

-- ── Seed sole manager (matches lib/auth/roles.ts MANAGER_EMAIL) ──────────
insert into public.managers (email, display_name)
values ('olanikegloria2020@gmail.com', 'Olanike')
on conflict (email) do update
set display_name = excluded.display_name;

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.managers enable row level security;
alter table public.content_creators enable row level security;

drop policy if exists "managers_select_authenticated" on public.managers;
create policy "managers_select_authenticated"
  on public.managers
  for select
  to authenticated
  using (true);

drop policy if exists "content_creators_select_own" on public.content_creators;
create policy "content_creators_select_own"
  on public.content_creators
  for select
  to authenticated
  using (
    lower(trim(email)) = lower(trim((select auth.jwt()->>'email')))
  );

drop policy if exists "content_creators_select_manager_all" on public.content_creators;
create policy "content_creators_select_manager_all"
  on public.content_creators
  for select
  to authenticated
  using (
    lower(trim((select auth.jwt()->>'email'))) = 'olanikegloria2020@gmail.com'
  );

drop policy if exists "content_creators_insert_own" on public.content_creators;
create policy "content_creators_insert_own"
  on public.content_creators
  for insert
  to authenticated
  with check (
    lower(trim(email)) = lower(trim((select auth.jwt()->>'email')))
  );
