-- Keep OAuth refresh tokens server-only. Never expose this table to browser clients.
create table if not exists public.youtube_connections (
 user_id uuid primary key references auth.users(id) on delete cascade,
 channel_id text not null,
 channel_title text not null,
 refresh_token text not null,
 updated_at timestamptz not null default now()
);
alter table public.youtube_connections enable row level security;
revoke all on public.youtube_connections from anon, authenticated;
-- Access exclusively via service-role on trusted server routes.
