// GET /api/x/callback → X returns here; the access_token response already contains user_id and screen_name.
import { CFG, siteUrl, setCookie, readSigned } from "../lib/burn.mjs";
import { oauthPost } from "../lib/oauth1.mjs";

const back = (req, cookies, err) => {
  const h = new Headers({ location: siteUrl(req) + "/" + (err ? "?xerror=" + encodeURIComponent(err) : "") + "#burn" });
  cookies.forEach(c => h.append("set-cookie", c));
  return new Response(null, { status: 302, headers: h });
};

export default async req => {
  const q = new URL(req.url).searchParams, saved = readSigned(req, "burn_oauth");
  const clear = setCookie("burn_oauth", null, 0);
  if (q.get("denied")) return back(req, [clear], "X sign-in was cancelled.");
  if (!saved || saved.t !== q.get("oauth_token") || !q.get("oauth_verifier")) return back(req, [clear], "X sign-in expired. Try again.");
  try {
    const r = await oauthPost("https://api.x.com/oauth/access_token", { key: CFG.xKey, secret: CFG.xSecret },
      { oauth_token: saved.t, oauth_verifier: q.get("oauth_verifier") }, saved.s);
    if (!r.user_id || !r.screen_name) throw new Error("no user in response");
    // We keep only the X id and handle. Access tokens are not stored anywhere.
    const sess = setCookie("burn_session", { id: r.user_id, username: r.screen_name }, 7 * 86400);
    return back(req, [clear, sess]);
  } catch (e) {
    console.error("x-callback", e.message);
    return back(req, [clear], "Couldn't finish X sign-in. Try again.");
  }
};
export const config = { path: "/api/x/callback" };
