// POST /api/lock {mode: "burn" | "early", wallet} → final step. Locks the drop once tasks are done.
//   burn  → needs counted burns on this wallet (from /api/claim)
//   early → no burns needed: early supporters split 5% of supply equally. If the wallet did burn, it locks as a burner.
import { CFG, json, fail, session, sb, isAddr, stats, estimate, earlyEstimate, tasksDone, myClaim } from "../lib/burn.mjs";

export default async req => {
  const s = session(req); if (!s) return fail("Sign in with X first.", 401);
  const { mode, wallet } = await req.json().catch(() => ({}));
  if (!["burn", "early"].includes(mode)) return fail("Unknown mode.");
  if (!isAddr(wallet)) return fail("Not a Solana address.");
  const w = wallet;
  if (w === CFG.dead) return fail("That's the burn address. Use your own wallet.");
  let row;
  try { row = await myClaim(s.id); } catch { return fail("Couldn't reach the database. Try again in a moment.", 500); }
  if (!row || !tasksDone(row.tasks)) return fail("Finish the four tasks first.", 409);
  const burned = row.wallet === w ? row.tokens_counted || 0 : 0;
  if (mode === "burn" && !burned) return fail("No burned tokens found for this wallet yet.", 409);
  const st = await stats();
  const kind = burned > 0 ? "burn" : "early";
  const est = kind === "burn" ? estimate(burned, st) : earlyEstimate(st);
  const patch = { wallet: w, confirmed: true, early: kind === "early", estimate: est, ...(row.wallet !== w ? { tokens_counted: 0, tokens: [] } : {}) };
  try {
    await sb(`claims?x_id=eq.${encodeURIComponent(s.id)}`, { method: "PATCH", prefer: "return=minimal", body: patch });
  } catch (e) {
    if (e.code === "23505") return fail("This wallet is already linked to another X account.", 409);
    return fail("Couldn't save. Try again in a moment.", 500);
  }
  return json({ kind, estimate: est, tokens: kind === "burn" ? row.tokens || [] : [], stats: await stats() });
};
export const config = { path: "/api/lock", method: "POST" };
