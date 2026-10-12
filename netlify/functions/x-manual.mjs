// POST /api/x/manual {username} — testing only, works when ALLOW_MANUAL_HANDLE=true
import { CFG, json, fail, setCookie } from "../lib/burn.mjs";

export default async req => {
  if (!CFG.allowManual) return fail("Manual sign-in is off.", 403);
  const { username } = await req.json().catch(() => ({}));
  if (!/^[A-Za-z0-9_]{1,15}$/.test(username || "")) return fail("Handles use letters, numbers and _ only, up to 15 characters.");
  const user = { id: "manual:" + username.toLowerCase(), username };
  return json({ user }, 200, { "set-cookie": setCookie("burn_session", user, 7 * 86400) });
};
export const config = { path: "/api/x/manual", method: "POST" };
