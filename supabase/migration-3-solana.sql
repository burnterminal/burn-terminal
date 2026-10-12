-- BURN Terminal · migration 3: Solana wallets
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to run twice.
-- Solana addresses are base58 and case-sensitive, so they are stored exactly as pasted.

alter table public.claims drop constraint if exists wallet_format;
alter table public.claims add constraint wallet_format check (wallet ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$') not valid;

-- Old EVM test rows (0x… wallets) can't receive a Solana airdrop. To start clean, run this too:
-- delete from public.claims where wallet like '0x%';
