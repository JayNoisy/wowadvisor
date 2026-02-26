-- Run in Supabase SQL editor.
-- Stores per-user copied/viewed builds for freshness checks and future account features.

create table if not exists public.user_build_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('copy', 'view')),
  class_name text not null,
  spec_name text not null,
  mode text not null,
  export_string text not null,
  build_fingerprint text not null,
  build_title text,
  build_updated_at timestamptz,
  confidence_score integer check (confidence_score between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_build_events_user_created
  on public.user_build_events (user_id, created_at desc);

create index if not exists idx_user_build_events_lookup
  on public.user_build_events (user_id, class_name, spec_name, mode, created_at desc);

alter table public.user_build_events enable row level security;

drop policy if exists users_select_own_build_events on public.user_build_events;
create policy users_select_own_build_events
  on public.user_build_events
  for select
  using (auth.uid() = user_id);

drop policy if exists users_insert_own_build_events on public.user_build_events;
create policy users_insert_own_build_events
  on public.user_build_events
  for insert
  with check (auth.uid() = user_id);
