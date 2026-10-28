import overrides from "../data/gd-referrer-by-id.json";

const GD_HOME = "https://gamedistribution.com/";

type OverrideFile = Record<string, string>;

const GD_ID_TO_PUBLISH_SLUG = new Map<string, string>();

function normalizeGdId(gdId: string): string {
  const trimmed = gdId.replace(/\/$/, "");
  if (/^[a-f0-9]{32}$/i.test(trimmed)) return trimmed.toLowerCase();
  const segment = trimmed.split("/").find((part) => /^[a-f0-9]{32}$/i.test(part));
  return (segment ?? trimmed).toLowerCase();
}

for (const [id, publishSlug] of Object.entries(overrides as OverrideFile)) {
  GD_ID_TO_PUBLISH_SLUG.set(normalizeGdId(id), publishSlug);
}

/** Official GameDistribution embed player (avoids “not available here” on custom domains). */
export function buildGameDistributionEmbedSrc(
  gdId: string,
  width: number,
  height: number,
  referrerUrl: string,
): string {
  const path = gdId.endsWith("/") ? gdId : `${gdId}/`;
  const gameUrl = `https://html5.gamedistribution.com/${path}`;
  const params = new URLSearchParams();
  params.set("url", gameUrl);
  params.set("width", String(Math.max(200, Math.round(width))));
  params.set("height", String(Math.max(200, Math.round(height))));
  params.set("gd_sdk_referrer_url", referrerUrl.startsWith("http") ? referrerUrl : GD_HOME);
  params.set("gdpr-tracking", "1");
  params.set("gdpr-targeting", "1");
  return `https://embed.gamedistribution.com/?${params.toString()}`;
}

type ReferrerGame = { slug: string; gdId?: string; gdPublishSlug?: string };

/** GD publisher game page as referrer — never the Polygons URL (that triggers the external-play gate). */
export function gameDistributionReferrer(game: ReferrerGame): string {
  if (game.gdPublishSlug) {
    return `${GD_HOME}games/${game.gdPublishSlug}/`;
  }
  if (game.slug.startsWith("gd-")) {
    return `${GD_HOME}games/${game.slug.slice(3)}/`;
  }
  if (game.gdId) {
    const publishSlug = GD_ID_TO_PUBLISH_SLUG.get(normalizeGdId(game.gdId));
    if (publishSlug) return `${GD_HOME}games/${publishSlug}/`;
  }
  return GD_HOME;
}
