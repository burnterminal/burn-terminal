-- BURN Terminal · Supabase schema
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Only the Netlify functions (service role key) can read or write. The browser never talks to the database.

create table if not exists public.claims (
  id              bigint generated always as identity primary key,
  x_id            text        not null unique,          -- X user id (one X account = one row)
  x_username      text        not null,
  x_created_at    timestamptz,                           -- X account creation date, for anti-sybil checks
  wallet          text        unique,                    -- Solana address as pasted (base58, case-sensitive), set at step 3
  tokens_counted  int         not null default 0,        -- distinct shitcoins that reached the burn address
  tokens          jsonb       not null default '[]',     -- [{address, symbol}]
  tasks           jsonb       not null default '{}',     -- {follow, likert, tg}
  confirmed       boolean     not null default false,    -- tasks done and drop locked (burn or early)
  early           boolean     not null default false,    -- locked in without burning (early supporter)
  estimate        numeric,                               -- estimate shown to the user at claim time
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint wallet_format check (wallet ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
  constraint tokens_counted_range check (tokens_counted between 0 and 1000)
);

create index if not exists claims_confirmed_idx on public.claims (confirmed);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists claims_touch on public.claims;
create trigger claims_touch before update on public.claims
for each row execute function public.touch_updated_at();

-- lock the table: RLS on, no policies, no grants for public roles
alter table public.claims enable row level security;
revoke all on public.claims from anon, authenticated;

-- live numbers: + early supporters
create or replace function public.burn_stats() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'claimers',  count(*) filter (where tokens_counted > 0),
    'confirmed', count(*) filter (where confirmed and tokens_counted > 0),
    'tokens',    coalesce(sum(tokens_counted), 0),
    'points',    coalesce(sum(power(least(tokens_counted, 30), 0.7)) filter (where tokens_counted > 0), 0),
    'early',     count(*) filter (where confirmed and tokens_counted = 0 and wallet is not null)
  ) from public.claims;
$$;
revoke execute on function public.burn_stats() from public, anon, authenticated;

-- final drop at snapshot
--   burners (15% = 150,000,000): 30% equally, 70% by points = min(tokens, 30) ^ 0.7
--   early supporters (5% = 50,000,000): equally between confirmed people who burned nothing
drop view if exists public.allocation;
create view public.allocation with (security_invoker = true) as
with b as (
  select x_username, wallet, tokens_counted, power(least(tokens_counted, 30), 0.7) as pts
  from public.claims where confirmed and tokens_counted > 0
), bt as (
  select count(*)::numeric as n, sum(pts) as sp from b
), e as (
  select x_username, wallet from public.claims
  where confirmed and tokens_counted = 0 and wallet is not null
), et as (
  select count(*)::numeric as n from e
)
select b.x_username, b.wallet, b.tokens_counted,
       round(45000000 / bt.n + 105000000 * b.pts / bt.sp) as drop_amount, 'burner'::text as kind
from b, bt
union all
select e.x_username, e.wallet, 0, round(50000000 / et.n), 'early'::text
from e, et
order by drop_amount desc;
revoke all on public.allocation from anon, authenticated;


-- explicit access for the server key (needed when "Automatically expose new tables" is off)
grant usage on schema public to service_role;
grant select, insert, update, delete on public.claims to service_role;
grant execute on function public.burn_stats() to service_role;
grant select on public.allocation to service_role;

-- Snapshot export: select * from public.allocation;
-- Sanity check, should be ~200,000,000: select kind, count(*), sum(drop_amount) from public.allocation group by kind;
