import type { VercelRequest, VercelResponse } from "@vercel/node";
import { recordPlay } from "./lib/plays-store";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const body = req.body;
  const slug =
    body && typeof body === "object" && "slug" in body ? String((body as { slug: unknown }).slug) : "";

  const result = await recordPlay(slug);
  if (!result.ok) {
    const status = result.reason === "storage_not_configured" ? 503 : 400;
    return res.status(status).json(result);
  }

  return res.status(200).json(result);
}
