// POST /api/claim {wallet} → re-checks burns on-chain, saves the claim, returns the estimate
import { CFG, json, fail, session, isAddr, burnedItems, sb, stats, estimate } from "../lib/burn.mjs";

export default async req => {
  const s = session(req); if (!s) return fail("Sign in with X first.", 401);
  const { wallet } = await req.json().catch(() => ({}));
  if (!isAddr(wallet)) return fail("Not a Solana address.");
  if (wallet === CFG.dead) return fail("That's the burn address. Use your own wallet.");
  let burned, skipped;
  try { ({ burned, skipped } = await burnedItems(wallet)); }
  catch (e) {
    console.error("claim:", e.message);
    if (e.busy) return fail("Lots of people burning right now. Retrying…", 503);
    return fail("Couldn't check Solana right now. Your sends are safe, try again in a minute.", 502);
  }
  const st = await stats();
  const est = estimate(burned.length, st);
  try {
    await sb("claims?on_conflict=x_id", {
      method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
      body: { x_id: s.id, x_username: s.username, x_created_at: s.created || null, wallet, tokens_counted: burned.length, tokens: burned, estimate: est },
    });
  } catch (e) {
    if (e.code === "23505") return fail("This wallet is already linked to another X account.", 409);
    return fail("Couldn't save your claim. Try again in a moment.", 500);
  }
  return json({ burned, skipped, estimate: est, stats: await stats() });
};
export const config = { path: "/api/claim", method: "POST" };
