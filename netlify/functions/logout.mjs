// POST /api/logout
import { json, setCookie } from "../lib/burn.mjs";
export default async () => json({ ok: true }, 200, { "set-cookie": setCookie("burn_session", null, 0) });
export const config = { path: "/api/logout", method: "POST" };
