// GET /api/stats → live numbers from Supabase
import { json, stats } from "../lib/burn.mjs";
export default async () => json(await stats(), 200, { "cache-control": "public, max-age=30" });
export const config = { path: "/api/stats" };
