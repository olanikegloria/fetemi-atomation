-- Run in Supabase SQL Editor after Auth is working.
-- Adjust manager email if needed (must match lib/auth/roles.ts MANAGER_EMAIL).

-- 1) Enable RLS
alter table public.ideas enable row level security;

-- 2) Drop old policies if re-running (ignore errors if names differ)
drop policy if exists "ideas_select_creator_own" on public.ideas;
drop policy if exists "ideas_select_manager_all" on public.ideas;

-- 3) Content creators: read only their own idea rows
create policy "ideas_select_creator_own"
  on public.ideas
  for select
  to authenticated
  using (
    lower(trim(submitted_by)) = lower(trim((select auth.jwt()->>'email')))
  );

-- 4) Manager: read all ideas (single manager account)
create policy "ideas_select_manager_all"
  on public.ideas
  for select
  to authenticated
  using (
    lower(trim((select auth.jwt()->>'email'))) = 'olanikegloria2020@gmail.com'
  );

-- Optional: allow creators to insert their own row only if you move intake to Supabase client inserts.
-- For now intake stays on n8n; no insert policy needed.
