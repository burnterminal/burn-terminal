// Minimal OAuth 1.0a (HMAC-SHA1) for "Sign in with X". No API reads, no credits needed.
import crypto from "node:crypto";

export const pct = s => encodeURIComponent(String(s)).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());

export function signature(method, url, params, consumerSecret, tokenSecret = "") {
  const norm = Object.keys(params).sort().map(k => `${pct(k)}=${pct(params[k])}`).join("&");
  const base = [method.toUpperCase(), pct(url), pct(norm)].join("&");
  return crypto.createHmac("sha1", `${pct(consumerSecret)}&${pct(tokenSecret)}`).update(base).digest("base64");
}

export function authHeader(method, url, { key, secret }, extra = {}, tokenSecret = "", nonce, ts) {
  const o = {
    oauth_consumer_key: key,
    oauth_nonce: nonce || crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: ts || Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
    ...extra,
  };
  o.oauth_signature = signature(method, url, o, secret, tokenSecret);
  return "OAuth " + Object.keys(o).sort().map(k => `${pct(k)}="${pct(o[k])}"`).join(", ");
}

export async function oauthPost(url, consumer, extra, tokenSecret) {
  const r = await fetch(url, { method: "POST", headers: { authorization: authHeader("POST", url, consumer, extra, tokenSecret) } });
  const text = await r.text();
  if (!r.ok) throw new Error(`X answered ${r.status}: ${text.slice(0, 200)}`);
  return Object.fromEntries(new URLSearchParams(text));
}
