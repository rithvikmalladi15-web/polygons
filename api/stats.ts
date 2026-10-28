import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllPlays } from "./lib/plays-store";

function adminAuthorized(req: VercelRequest): boolean {
  const expected = process.env.PLAY_STATS_ADMIN_TOKEN;
  if (!expected) return false;
  const header = req.headers["x-polygons-admin"];
  const token = Array.isArray(header) ? header[0] : header;
  return token === expected;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  if (!adminAuthorized(req)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const data = await getAllPlays();
  if (!data) {
    return res.status(503).json({ error: "storage_not_configured" });
  }

  const rows = Object.entries(data.counts)
    .map(([slug, count]) => ({ slug, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count);

  const totalPlays = rows.reduce((sum, row) => sum + row.count, 0);

  return res.status(200).json({
    totalPlays,
    uniqueSlugs: rows.length,
    updatedAt: data.updatedAt,
    rows,
  });
}
