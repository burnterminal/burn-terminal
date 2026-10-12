# Setup

Static site in `public/`, serverless functions in `netlify/functions/`, database in `supabase/`.

## 1 · Supabase

1. [supabase.com](https://supabase.com) → **New project**.
2. **SQL Editor** → New query → paste all of `supabase/schema.sql` → **Run**.
3. **Project Settings → API** → copy the Project URL and the secret (service-role) key.

The `claims` table has RLS on and no public grants. Only the functions read and write it, with the service key.

Upgrading an existing database instead of starting fresh: run `migration-2-early-supporters.sql`, then `migration-3-solana.sql`, before deploying the new code.

## 2 · X sign-in (OAuth 1.0a, free)

Sign-in returns the handle and id directly from X, so there are no paid API reads.

1. [console.x.com](https://console.x.com) → your app → **User authentication settings**: permission **Read**, "Request email" off.
2. Callback URI `https://YOUR-DOMAIN/api/x/callback`, Website URL `https://YOUR-DOMAIN`.
3. **Keys and tokens → Consumer Key** → Regenerate → `X_CONSUMER_KEY`, `X_CONSUMER_SECRET`.

## 3 · Alchemy (burn checks)

1. [dashboard.alchemy.com](https://dashboard.alchemy.com) → app → **Networks** → enable **Solana Mainnet**.
2. Copy the API key → `ALCHEMY_API_KEY`.
3. **Billing → Pay As You Go** for real traffic. The free tier rate limit is low.

A check costs about `40 + 40 × transactions` compute units, plus `80` per new asset name (cached). A wallet with 20 transactions ≈ 840 CU.

## 4 · Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → import this repository (or `npx netlify-cli deploy --prod`).
   Note: a drag-and-drop deploy of a zip may skip the functions. Connecting the repo is the reliable way.
2. **Site configuration → Environment variables** → add everything from `.env.example`.
3. **Deploys → Trigger deploy → Clear cache and deploy.** Env changes apply on the next deploy.

## 5 · Site settings

At the top of `public/app.js`, the `CONFIG` block:

- `xHandle`: your X account
- `launchTweetId`, `launchTweetUrl`: the post for like / repost / reply and for "Quote on X" on the final card
- `telegram`: your Telegram link

Bump the `?v=` on `style.css` and `app.js` in `index.html` after changes so browsers pick them up.

## Checking the database

Supabase → **Table Editor → claims** shows every signup. In the **SQL Editor**:

```sql
select x_username, wallet, early, confirmed, updated_at from public.claims order by updated_at desc limit 50;
select public.burn_stats();
select kind, count(*), sum(drop_amount) from public.allocation group by kind;
select * from public.allocation order by drop_amount desc;   -- Export → CSV for the snapshot
```

`select` queries change nothing. Be careful with `delete` and `update`.

## Logs

Netlify → **Logs → Functions** → `claim`, `lock`, … API keys are never written to the logs.
