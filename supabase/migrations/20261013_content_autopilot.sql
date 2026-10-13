-- Insta Social AI: automated content plans; brand_profiles is defined in the existing schema
create table if not exists public.social_plans (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 brand_id uuid not null references public.brand_profiles(id) on delete cascade,
 account_id uuid not null references public.instagram_accounts(id) on delete cascade,
 status text not null default 'draft' check(status in ('draft','active','paused','completed')),
 timezone text not null default 'America/Sao_Paulo',
 created_at timestamptz not null default now()
);
create table if not exists public.social_plan_items (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 plan_id uuid not null references public.social_plans(id) on delete cascade,
 topic text not null,
 image_prompt text not null,
 caption text not null,
 scheduled_at timestamptz not null,
 status text not null default 'planned' check(status in ('planned','generating','ready','published','failed')),
 asset_id uuid references public.media_assets(id),
 post_id uuid references public.instagram_posts(id),
 error text,
 created_at timestamptz not null default now(),
 unique(plan_id,scheduled_at)
);
create index if not exists social_plan_items_due_idx on public.social_plan_items(status,scheduled_at);
create index if not exists social_plans_owner_idx on public.social_plans(user_id);
alter table public.social_plans enable row level security;
alter table public.social_plan_items enable row level security;
drop policy if exists "social_plans_owner" on public.social_plans;
create policy "social_plans_owner" on public.social_plans for all to authenticated using (user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "social_plan_items_owner" on public.social_plan_items;
create policy "social_plan_items_owner" on public.social_plan_items for all to authenticated using (user_id=auth.uid()) with check(user_id=auth.uid());
grant usage on schema public to authenticated,service_role;
grant select,insert,update,delete on public.social_plans,public.social_plan_items to authenticated,service_role;
