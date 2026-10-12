// GET /api/x/login → "Sign in with X" (OAuth 1.0a). Free: no X API reads are made.
import { CFG, siteUrl, setCookie } from "../lib/burn.mjs";
import { oauthPost } from "../lib/oauth1.mjs";

export default async req => {
  if (!CFG.xKey || !CFG.xSecret) return new Response("X sign-in is not configured", { status: 503 });
  try {
    const r = await oauthPost("https://api.x.com/oauth/request_token", { key: CFG.xKey, secret: CFG.xSecret }, { oauth_callback: siteUrl(req) + "/api/x/callback" });
    if (r.oauth_callback_confirmed !== "true") throw new Error("callback not confirmed");
    return new Response(null, { status: 302, headers: {
      location: "https://api.x.com/oauth/authenticate?oauth_token=" + encodeURIComponent(r.oauth_token),
      "set-cookie": setCookie("burn_oauth", { t: r.oauth_token, s: r.oauth_token_secret }, 600),
    } });
  } catch (e) {
    console.error("x-login", e.message);
    return new Response(null, { status: 302, headers: { location: siteUrl(req) + "/?xerror=" + encodeURIComponent("Couldn't start X sign-in. Try again.") + "#burn" } });
  }
};
export const config = { path: "/api/x/login" };
