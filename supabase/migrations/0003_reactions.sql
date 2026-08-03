-- Lightweight per-article reaction tally ("👍 Useful"). Keyed by the
-- article's stable `link` (article `id`s are regenerated on every 6h fetch
-- build, so they can't be used as a durable key — see `sent_articles` for
-- the same reasoning). Accessed only via the `reactions` Edge Function using
-- the service-role key, so RLS is enabled with no policies.

create table if not exists public.reactions (
  link text primary key,
  count bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.reactions enable row level security;
