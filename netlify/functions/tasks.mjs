// POST /api/tasks {tasks, replyUrl} → saves the four social tasks (reply needs a link to the user's own reply). Step 2 of the flow, before wallet and burn.
import { json, fail, session, sb, TASKS, REPLY_RE } from "../lib/burn.mjs";

export default async req => {
  const s = session(req); if (!s) return fail("Sign in with X first.", 401);
  const { tasks = {}, replyUrl = "" } = await req.json().catch(() => ({}));
  const clean = Object.fromEntries(TASKS.map(k => [k, !!tasks[k]]));
  const m = String(replyUrl).trim().match(REPLY_RE);
  const okReply = !!m && m[1].toLowerCase() === String(s.username).toLowerCase();
  clean.reply = clean.reply && okReply;
  if (okReply) clean.reply_url = `https://x.com/${m[1]}/status/${m[2]}`;
  try {
    await sb("claims?on_conflict=x_id", {
      method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
      body: { x_id: s.id, x_username: s.username, tasks: clean },
    });
  } catch (e) { console.error("tasks:", e.message); return fail("Couldn't save. Try again in a moment.", 500); }
  return json({ tasks: clean });
};
export const config = { path: "/api/tasks", method: "POST" };
