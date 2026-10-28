import type { ClassicGame } from "../classics/types";
import { buildGameDistributionEmbedSrc, gameDistributionReferrer } from "./gd-embed";
import { localGamePath } from "./game-origin";

const GD_HOME = "https://gamedistribution.com/";

function abcEmbedUrl(abcPath: string): string {
  const path = abcPath.replace(/^\//, "");
  if (path.endsWith(".html")) {
    return `https://abc.cloudfree.jp/${path}`;
  }
  return `https://abc.cloudfree.jp/${path.replace(/\/$/, "")}/`;
}

/** Ordered embed URLs to try (direct hosts first — most reliable in iframes). */
export function classicEmbedCandidates(game: ClassicGame): string[] {
  const out: string[] = [];

  const local = localGamePath(game.slug);
  if (local) out.push(local);

  if (game.abcPath) {
    out.push(abcEmbedUrl(game.abcPath));
  }

  if (game.directUrl) {
    out.push(game.directUrl);
  }

  if (game.gdId) {
    const path = game.gdId.endsWith("/") ? game.gdId : `${game.gdId}/`;
    out.push(`https://html5.gamedistribution.com/${path}`);
    const referrers = new Set<string>([gameDistributionReferrer(game), GD_HOME]);
    for (const referrer of referrers) {
      out.push(buildGameDistributionEmbedSrc(game.gdId, game.width, game.height, referrer));
    }
  }

  return [...new Set(out)];
}

export function classicEmbedSrc(game: ClassicGame): string {
  return classicEmbedCandidates(game)[0] ?? "";
}
