import type { ClassicGame } from "../classics/types";
import { buildGameDistributionEmbedSrc, gameDistributionReferrer } from "./gd-embed";
import { localGamePath, proxyPath, siteOrigin } from "./game-origin";

const GD_HOME = "https://gamedistribution.com/";

function abcExternalUrl(abcPath: string): string {
  const path = abcPath.replace(/^\//, "");
  if (path.endsWith(".html")) {
    return `https://abc.cloudfree.jp/${path}`;
  }
  return `https://abc.cloudfree.jp/${path.replace(/\/$/, "")}/`;
}

function pushUnique(out: string[], url: string) {
  if (url && !out.includes(url)) out.push(url);
}

/**
 * In-site player URLs — same-origin (/games, /_abc, /_gd, /_ext) so games run on Polygons.
 */
export function classicEmbedCandidates(game: ClassicGame): string[] {
  const out: string[] = [];

  const local = localGamePath(game.slug);
  if (local) pushUnique(out, local);

  if (game.abcPath) {
    pushUnique(out, proxyPath(abcExternalUrl(game.abcPath)));
  }

  if (game.directUrl) {
    pushUnique(out, proxyPath(game.directUrl));
  }

  if (game.gdId) {
    const path = game.gdId.endsWith("/") ? game.gdId : `${game.gdId}/`;
    pushUnique(out, proxyPath(`https://html5.gamedistribution.com/${path}`));

    const referrers = new Set<string>([gameDistributionReferrer(game), GD_HOME]);
    for (const referrer of referrers) {
      pushUnique(
        out,
        proxyPath(buildGameDistributionEmbedSrc(game.gdId, game.width, game.height, referrer)),
      );
    }
  }

  return out;
}

export function classicEmbedSrc(game: ClassicGame): string {
  return classicEmbedCandidates(game)[0] ?? "";
}

/** Upstream host URL if the in-site proxy fails. */
export function classicExternalPlayUrl(game: ClassicGame): string {
  if (game.directUrl) return game.directUrl;
  if (game.abcPath) return abcExternalUrl(game.abcPath);
  if (game.gdId) {
    const path = game.gdId.endsWith("/") ? game.gdId : `${game.gdId}/`;
    return `https://html5.gamedistribution.com/${path}`;
  }
  const local = localGamePath(game.slug);
  if (local && siteOrigin()) return `${siteOrigin()}${local}`;
  return "";
}

/** Open full-screen player on this site (new tab, still Polygons). */
export function classicSameOriginPlayerUrl(game: ClassicGame): string {
  const src = classicEmbedSrc(game);
  if (!src) return "";
  if (src.startsWith("/") && siteOrigin()) return `${siteOrigin()}${src}`;
  return src;
}
