-- Web Push subscriptions (PWA) — optional persistence for /api/push/subscribe
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  expiration_time timestamptz null,
  user_agent text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Server uses service role; no anon policies on purpose.
comment on table public.push_subscriptions is 'PWA Web Push endpoints; written by API with service role only.';
