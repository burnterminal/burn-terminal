// Shared server helpers for BURN Terminal (Netlify Functions, Node 18+)
import crypto from "node:crypto";

const env = (k, d = "") => (process.env[k] ?? d).toString().trim();

export const CFG = {
  dead: env("DEAD_ADDRESS"),                                // Solana burn address (base58, case-sensitive)
  alchemyKey: env("ALCHEMY_API_KEY"),                       // dashboard.alchemy.com → app (Solana Mainnet enabled) → API Key
  alchemyUrl: env("ALCHEMY_URL", "https://solana-mainnet.g.alchemy.com/v2").replace(/\/$/, ""),
  maxScan: +env("MAX_TX_SCAN", "300"),                      // newest transactions per wallet to look through
  campaignStart: Date.parse(env("CAMPAIGN_START", "2026-10-06T00:00:00Z")),
  exclude: env("EXCLUDE_SYMBOLS", "SOL,WSOL,USDC,USDT,PYUSD,USDS,USDG,BURN").split(",").map(s => s.trim().toUpperCase()).filter(Boolean),
  excludeMints: env("EXCLUDE_MINTS", "So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB,2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo").split(",").map(s => s.trim()).filter(Boolean),
  maxCounted: 30,
  pool: 150_000_000, basePct: 0.30, exponent: 0.7, expected: 4000, avgTokens: 2.3,
  earlyPool: 50_000_000, earlyExpected: 5000,   // 5% of supply, split equally between early supporters (no burn)
  allowManual: env("ALLOW_MANUAL_HANDLE") === "true",
  xKey: env("X_CONSUMER_KEY"), xSecret: env("X_CONSUMER_SECRET"),   // X app → Keys and tokens → Consumer Key (OAuth 1.0a)
  secret: env("SESSION_SECRET"),
  supaUrl: env("SUPABASE_URL").replace(/\/$/, ""), supaKey: env("SUPABASE_SERVICE_ROLE_KEY"),
};
export const siteUrl = req => env("SITE_URL") || env("URL") || new URL(req.url).origin;

/* ---------- responses ---------- */
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers } });
export const fail = (msg, status = 400) => json({ error: msg }, status);

/* ---------- signed cookies ---------- */
const b64u = b => Buffer.from(b).toString("base64url");
function sign(obj) {
  if (!CFG.secret) throw new Error("SESSION_SECRET is not set");
  const body = b64u(JSON.stringify(obj));
  const mac = crypto.createHmac("sha256", CFG.secret).update(body).digest("base64url");
  return body + "." + mac;
}
function unsign(tok) {
  if (!tok || !CFG.secret) return null;
  const [body, mac] = tok.split(".");
  if (!body || !mac) return null;
  const good = crypto.createHmac("sha256", CFG.secret).update(body).digest("base64url");
  if (mac.length !== good.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return null;
  try { const o = JSON.parse(Buffer.from(body, "base64url").toString()); return o.exp && o.exp < Date.now() ? null : o; } catch { return null; }
}
export function getCookie(req, name) {
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : null;
}
export function setCookie(name, obj, maxAge) {
  const v = obj ? sign({ ...obj, exp: Date.now() + maxAge * 1000 }) : "";
  return `${name}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${obj ? maxAge : 0}`;
}
export const readSigned = (req, name) => unsign(getCookie(req, name));
export const session = req => readSigned(req, "burn_session");

/* ---------- Supabase REST (service role, server only) ---------- */
export async function sb(path, { method = "GET", body, prefer } = {}) {
  if (!CFG.supaUrl || !CFG.supaKey) throw new Error("Supabase is not configured");
  const r = await fetch(`${CFG.supaUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: CFG.supaKey,
      // legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys only go in apikey
      ...(CFG.supaKey.startsWith("eyJ") ? { authorization: `Bearer ${CFG.supaKey}` } : {}),
      "content-type": "application/json", ...(prefer ? { prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) { const e = new Error(data?.message || "Database error"); e.code = data?.code; e.status = r.status; throw e; }
  return data;
}
export async function stats() {
  try { return await sb("rpc/burn_stats", { method: "POST", body: {} }); }
  catch { return { claimers: 0, confirmed: 0, tokens: 0, points: 0, early: 0 }; }
}
export const TASKS = ["follow", "likert", "reply", "tg"];   // the quote is at the end (optional, with the card)
// reply: a link to the user's own reply. Format and handle are checked, the post itself is not fetched (X API is paid).
export const REPLY_RE = /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status(?:es)?\/(\d{5,25})/i;
export const tasksDone = t => TASKS.every(k => t?.[k] === true);
export const myClaim = async id => (await sb(`claims?x_id=eq.${encodeURIComponent(id)}&select=*`))?.[0] || null;

/* ---------- drop math (mirrors the site and the SQL view) ---------- */
const P = 1 / CFG.avgTokens;
let E = 0; for (let k = 1; k < 400; k++) E += P * Math.pow(1 - P, k - 1) * Math.pow(Math.min(k, 30), CFG.exponent);
export const points = n => n > 0 ? Math.pow(Math.min(n, CFG.maxCounted), CFG.exponent) : 0;
export function estimate(n, st = {}) {
  if (n <= 0) return 0;
  const N = Math.max(CFG.expected, st.claimers || 0), SP = Math.max(CFG.expected * E, st.points || 0);
  return Math.round(CFG.pool * CFG.basePct / N + CFG.pool * (1 - CFG.basePct) * points(n) / SP);
}
export const earlyEstimate = (st = {}) => Math.round(CFG.earlyPool / Math.max(CFG.earlyExpected, st.early || 0));

/* ---------- Alchemy (Solana) ---------- */
// One check = the wallet's newest transactions since CAMPAIGN_START (getSignaturesForAddress, 40 CU)
// + each transaction parsed (getTransaction, 40 CU). A mint counts when, inside one successful transaction,
// the wallet's balance of it went down and the burn address's balance of it went up. Covers SPL, Token-2022 and NFTs.
// Names come from DAS getAsset (80 CU) and are cached. No holder, price or token-age filters.
const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const isAddr = a => B58.test(a || "");
const sleepMs = ms => new Promise(r => setTimeout(r, ms));
async function rpc(method, params) {
  if (!CFG.alchemyKey) throw new Error("ALCHEMY_API_KEY is not set");
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${CFG.alchemyUrl}/${CFG.alchemyKey}`, {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const j = await r.json().catch(() => null);
    const limited = r.status === 429 || j?.error?.code === 429 || /capacity|rate limit|too many/i.test(j?.error?.message || "");
    if (limited) { await sleepMs(350 * (attempt + 1) + Math.random() * 250); continue; }
    // errors carry the method and status only, never the URL (it contains the key)
    if (!r.ok || j?.error) throw new Error(`alchemy ${method} ${r.status} ${(j?.error?.message || "").slice(0, 120)}`);
    return j.result;
  }
  const e = new Error(`alchemy ${method} rate limited`); e.busy = true; throw e;
}
/* base58 + program-derived addresses (for compressed NFT asset ids), no dependencies */
const ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function b58dec(str) {
  let n = 0n; for (const c of str) { const i = ALPHA.indexOf(c); if (i < 0) throw new Error("bad base58"); n = n * 58n + BigInt(i); }
  const bytes = []; while (n > 0n) { bytes.unshift(Number(n & 255n)); n >>= 8n; }
  for (const c of str) { if (c === "1") bytes.unshift(0); else break; }
  return Buffer.from(bytes);
}
function b58enc(buf) {
  let n = BigInt("0x" + (Buffer.from(buf).toString("hex") || "0")), out = "";
  while (n > 0n) { out = ALPHA[Number(n % 58n)] + out; n /= 58n; }
  for (const b of buf) { if (b === 0) out = "1" + out; else break; }
  return out;
}
const P25519 = 2n ** 255n - 19n, D25519 = (-121665n * modInv(121666n)) % P25519;
function modPow(b, e, m) { let r = 1n; b %= m; if (b < 0n) b += m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; }
function modInv(a) { return modPow(((a % P25519) + P25519) % P25519, P25519 - 2n, P25519); }
function onCurve(bytes) {                                   // is this 32-byte string a valid ed25519 point?
  const b = Buffer.from(bytes); b[31] &= 0x7f;
  const y = BigInt("0x" + Buffer.from(b).reverse().toString("hex"));
  if (y >= P25519) return false;
  const y2 = y * y % P25519, u = (y2 - 1n + P25519) % P25519, v = (D25519 * y2 + 1n) % P25519;
  const x2 = u * modInv(v) % P25519;
  return x2 === 0n || modPow(x2, (P25519 - 1n) / 2n, P25519) === 1n;
}
function findPda(seeds, programId) {
  const prog = b58dec(programId);
  for (let bump = 255; bump >= 0; bump--) {
    const h = crypto.createHash("sha256").update(Buffer.concat([...seeds, Buffer.from([bump]), prog, Buffer.from("ProgramDerivedAddress")])).digest();
    if (!onCurve(h)) return b58enc(h);
  }
  throw new Error("no PDA");
}
const BUBBLEGUM = "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY", CORE = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
export const cnftAssetId = (tree, nonce) => { const n = Buffer.alloc(8); n.writeBigUInt64LE(BigInt(nonce)); return findPda([Buffer.from("asset"), b58dec(tree), n], BUBBLEGUM); };

async function pool(items, n, fn) {                           // run fn over items, n at a time
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

/* names: DAS getAsset → symbol, else name, else short mint */
const meta = new Map(); // mint/asset → { name, nft, collection, owner }
const tidy = s => (s || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 32);
async function assetInfo(mint) {
  if (meta.has(mint)) return meta.get(mint);
  let name = "", nft = null, collection = null, owner = null;
  try {
    const a = await rpc("getAsset", { id: mint });
    collection = (a?.grouping || []).find(g => g.group_key === "collection")?.group_value || null;
    owner = a?.ownership?.owner || null;
    name = tidy(a?.token_info?.symbol) || tidy(a?.content?.metadata?.symbol) || tidy(a?.content?.metadata?.name);
    const iface = a?.interface || "";
    nft = /NFT|Programmable|MplCore/i.test(iface) ? true : /Fungible/i.test(iface) ? false : null;
    if (nft && tidy(a?.content?.metadata?.name)) name = tidy(a.content.metadata.name).replace(/\s*#\d+$/, "");   // NFTs: collection-ish name
  } catch {}
  const v = { name: name || mint.slice(0, 4) + "…" + mint.slice(-4), nft, collection, owner };
  meta.set(mint, v);
  return v;
}

// balance change per (owner, mint) inside one transaction
function deltas(tx) {
  const d = new Map(), key = (o, m) => o + "|" + m;
  const put = (b, sign) => { if (!b?.owner || !b?.mint) return; const k = key(b.owner, b.mint), v = BigInt(b.uiTokenAmount?.amount || "0") * BigInt(sign); const cur = d.get(k) || { owner: b.owner, mint: b.mint, dec: b.uiTokenAmount?.decimals ?? 0, v: 0n }; cur.v += v; d.set(k, cur); };
  for (const b of tx?.meta?.preTokenBalances || []) put(b, -1);
  for (const b of tx?.meta?.postTokenBalances || []) put(b, 1);
  return [...d.values()];
}

const cache = new Map(), inflight = new Map(); // wallet → { at, data } / pending promise
// Distinct tokens and NFT collections sent from `wallet` to the burn address after the campaign start.
// Cache is 10 s, shorter than the 15 s button cooldown, so every real click sees fresh data.
export async function burnedItems(wallet) {
  if (!CFG.dead) throw new Error("DEAD_ADDRESS is not set");
  const me = wallet, hit = cache.get(me);
  if (hit && Date.now() - hit.at < 10_000) return hit.data;
  if (inflight.has(me)) return inflight.get(me);
  const job = (async () => {
    // 1 · signatures since the campaign start, newest first
    const sigs = []; let before;
    while (sigs.length < CFG.maxScan) {
      const page = await rpc("getSignaturesForAddress", [me, { limit: 1000, ...(before ? { before } : {}), commitment: "confirmed" }]);
      if (!page?.length) break;
      let older = false;
      for (const s of page) {
        if (s.blockTime && s.blockTime * 1000 < CFG.campaignStart) { older = true; break; }
        if (!s.err) sigs.push(s.signature);
        if (sigs.length >= CFG.maxScan) break;
      }
      if (older || page.length < 1000) break;
      before = page[page.length - 1].signature;
    }
    // 2 · parse them, find what moved from the wallet to the burn address
    const found = new Map();
    await pool(sigs, 8, async sig => {
      const tx = await rpc("getTransaction", [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0, commitment: "confirmed" }]);
      if (!tx || tx.meta?.err) return;
      const ds = deltas(tx);
      for (const d of ds) {
        if (d.owner !== CFG.dead || d.v <= 0n) continue;
        const out = ds.find(x => x.owner === me && x.mint === d.mint && x.v < 0n);
        if (out && !found.has(d.mint)) found.set(d.mint, { dec: d.dec, amount: d.v });
      }
      // NFTs without token accounts: Metaplex Core and compressed NFTs (Bubblegum), top-level or inner instructions
      const ixs = [...(tx.transaction?.message?.instructions || []), ...(tx.meta?.innerInstructions || []).flatMap(x => x.instructions || [])];
      for (const ix of ixs) {
        const acc = ix.accounts || [];
        if (!acc.includes(CFG.dead) || !acc.includes(me)) continue;
        try {
          if (ix.programId === CORE && acc[0] && acc.indexOf(CFG.dead) > 0) {
            if (!found.has(acc[0])) found.set(acc[0], { core: true });
          } else if (ix.programId === BUBBLEGUM && ix.data) {
            const tree = acc[acc.indexOf(CFG.dead) + 1], data = b58dec(ix.data);
            if (tree && data.length >= 12) {                    // every transfer ends with nonce (u64) + index (u32)
              const id = cnftAssetId(tree, data.readBigUInt64LE(data.length - 12));
              if (!found.has(id)) found.set(id, { cnft: true });
            }
          }
        } catch (e) { console.error("nft parse:", e.message); }
      }
    });
    // 3 · names + token/NFT
    const burned = [], skipped = [], seenKey = new Set();
    const rows = await pool([...found.entries()], 6, async ([mint, f]) => {
      const info = await assetInfo(mint);
      if ((f.core || f.cnft) && info.owner && info.owner !== CFG.dead) return null;   // not (or no longer) with us
      // compressed NFTs are detected but never count (spam is free to mint and airdrop)
      if (f.cnft) return { address: mint, symbol: info.name, kind: "nft", skip: "cnft" };
      const nft = f.core ? true : info.nft ?? (f.dec === 0 && f.amount === 1n);
      // NFTs count per collection; a collection's address keys it, a lone NFT keys itself
      return { address: nft && info.collection ? info.collection : mint, symbol: info.name, kind: nft ? "nft" : "token" };
    });
    for (const row of rows) {
      if (!row || seenKey.has(row.address)) continue;
      seenKey.add(row.address);
      if (row.skip) { const { skip, ...r } = row; skipped.push({ ...r, reason: skip }); }
      else if (CFG.excludeMints.includes(row.address) || CFG.exclude.includes(row.symbol.toUpperCase())) skipped.push({ ...row, reason: "keep" });
      else burned.push(row);
    }
    const data = { burned: burned.slice(0, CFG.maxCounted), skipped };
    cache.set(me, { at: Date.now(), data });
    return data;
  })();
  inflight.set(me, job);
  try { return await job; } finally { inflight.delete(me); }
}
