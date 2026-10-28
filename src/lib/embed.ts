import type { ClassicGame } from "../classics/types";
import { buildGameDistributionEmbedSrc, gameDistributionReferrer } from "./gd-embed";
import { localGamePath, proxyPath, siteOrigin } from "./game-origin";

const GD_HOME = "https://gamedistribution.com/";

const embedCandidateCache = new Map<string, string[]>();

/** Folder URLs must hit index.html on abc/GD/github — not on Nitrome CDN. */
function withIndexHtml(external: string): string {
  if (!external || external.includes("embed.gamedistribution.com/?")) return external;
  const [base, query] = external.split("?");
  if (base.endsWith(".html") || base.endsWith(".htm") || base.endsWith("/embed")) return external;
  if (base.includes("cdn.nitrome.com")) return external;
  if (base.endsWith("/")) return query ? `${base}index.html?${query}` : `${base}index.html`;
  return external;
}

function finalizeProxyPath(path: string): string {
  if (!path.startsWith("/")) return path;
  if (path.endsWith("/index.html")) return path;
  if (path.startsWith("/_ext/nitrome/")) return path.replace(/\/$/, "");
  if (path.endsWith("/")) return `${path}index.html`;
  return path;
}

function abcExternalUrl(abcPath: string): string {
  const path = abcPath.replace(/^\//, "");
  if (path.endsWith(".html") && !path.includes("/")) {
    return `https://abc.cloudfree.jp/${path}`;
  }
  if (path.endsWith(".html")) {
    return `https://abc.cloudfree.jp/${path}`;
  }
  const folder = path.replace(/\/index\.html$/i, "").replace(/\/$/, "");
  return `https://abc.cloudfree.jp/${folder}/index.html`;
}

function pushUnique(out: string[], url: string) {
  if (url && !out.includes(url)) out.push(url);
}

/**
 * In-site player URLs — same-origin (/games, /_abc, /_gd, /_ext) so games run on Polygons.
 */
export function classicEmbedCandidates(game: ClassicGame): string[] {
  const cached = embedCandidateCache.get(game.slug);
  if (cached) return cached;

  const out: string[] = [];

  const local = localGamePath(game.slug);
  if (local) pushUnique(out, local);

  if (game.abcPath) {
    pushUnique(out, finalizeProxyPath(proxyPath(abcExternalUrl(game.abcPath))));
  }

  if (game.directUrl) {
    pushUnique(out, finalizeProxyPath(proxyPath(withIndexHtml(game.directUrl))));
  }

  if (game.gdId) {
    const path = game.gdId.endsWith("/") ? game.gdId : `${game.gdId}/`;
    const referrers = new Set<string>([gameDistributionReferrer(game), GD_HOME]);
    for (const referrer of referrers) {
      pushUnique(
        out,
        finalizeProxyPath(
          proxyPath(buildGameDistributionEmbedSrc(game.gdId, game.width, game.height, referrer)),
        ),
      );
    }

    pushUnique(
      out,
      finalizeProxyPath(proxyPath(withIndexHtml(`https://html5.gamedistribution.com/${path}`))),
    );
  }

  const normalized = out.map((url) => (url.startsWith("http") ? finalizeProxyPath(proxyPath(url)) : url));
  const sameOrigin = normalized.filter((url) => url.startsWith("/"));
  const result = sameOrigin.length ? sameOrigin : normalized;
  embedCandidateCache.set(game.slug, result);
  return result;
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
