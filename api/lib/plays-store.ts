import { kv } from "@vercel/kv";

const HASH_KEY = "polygons_play_counts";
const UPDATED_KEY = "polygons_plays_updated";

export function kvEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/** Keep slug identical to catalog URLs (/hit/…) so stats line up with game names. */
export function normalizeSlug(slug: string): string {
  const safe = slug.trim().slice(0, 160);
  if (!safe || /\s/.test(safe)) return "";
  return safe;
}

export async function recordPlay(slug: string) {
  if (!kvEnabled()) {
    return { ok: false as const, reason: "storage_not_configured" as const };
  }
  const safe = normalizeSlug(slug);
  if (!safe) {
    return { ok: false as const, reason: "invalid_slug" as const };
  }
  const count = await kv.hincrby(HASH_KEY, safe, 1);
  await kv.set(UPDATED_KEY, Date.now());
  return { ok: true as const, slug: safe, count };
}

export async function getAllPlays(): Promise<{ counts: Record<string, number>; updatedAt: number | null } | null> {
  if (!kvEnabled()) return null;
  const counts = await kv.hgetall<Record<string, number>>(HASH_KEY);
  const updatedAt = await kv.get<number>(UPDATED_KEY);
  return {
    counts: counts ?? {},
    updatedAt: updatedAt ?? null,
  };
}
