-- BURN Terminal · migration 2: tasks first + early supporters (5% of supply, no burn needed)
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to run twice.

-- people now save tasks before they paste a wallet
alter table public.claims alter column wallet drop not null;
-- true = locked in without burning (early supporter)
alter table public.claims add column if not exists early boolean not null default false;

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
grant execute on function public.burn_stats() to service_role;

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
grant select on public.allocation to service_role;

-- Snapshot export: select * from public.allocation;
-- Sanity check, should be ~200,000,000: select kind, count(*), sum(drop_amount) from public.allocation group by kind;
