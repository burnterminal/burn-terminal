// GET /api/me → who is signed in, what is configured, saved claim if any
import { CFG, json, session, sb } from "../lib/burn.mjs";

export default async req => {
  const s = session(req);
  let claim = null;
  if (s) { try { [claim] = await sb(`claims?x_id=eq.${encodeURIComponent(s.id)}&select=wallet,tokens,tokens_counted,tasks,confirmed,early,estimate`); } catch {} }
  return json({
    user: s ? { id: s.id, username: s.username } : null,
    xEnabled: !!(CFG.xKey && CFG.xSecret), manualAllowed: CFG.allowManual,
    claim: claim || null,
    deadAddress: CFG.dead || null,
  });
};
export const config = { path: "/api/me" };
