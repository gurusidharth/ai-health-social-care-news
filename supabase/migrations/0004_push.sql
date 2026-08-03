-- Web Push subscriptions + dedup for the "breaking news" push feature (fires
-- for at most one article — the fetch cycle's hero story — per 6h cycle).
-- Both accessed only via Edge Functions using the service-role key, so RLS
-- is enabled with no policies, matching subscribers/sent_articles/reactions.

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Keyed by the article's stable `link` (same reasoning as sent_articles /
-- reactions — the article `id` is regenerated every fetch build).
create table if not exists public.pushed_articles (
  link text primary key,
  pushed_at timestamptz not null default now()
);

alter table public.pushed_articles enable row level security;
