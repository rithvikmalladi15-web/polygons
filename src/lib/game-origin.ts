import localGames from "../data/local-games.json";
import { PROXY_PREFIXES } from "./proxy-routes";

const LOCAL = localGames as Record<string, string>;

export function siteOrigin(): string {
  if (typeof location !== "undefined") return location.origin;
  return "";
}

/** Vercel rewrite is /_gd/embed?… — a slash before ? yields NOT_FOUND. */
function normalizeProxiedPath(path: string): string {
  return path.replace(/^(\/_gd\/embed)\/\?/, "$1?");
}

/** Map external game URL → same-origin path (e.g. /_abc/mario/). */
export function proxyPath(external: string): string {
  if (!external || external.startsWith("/")) return normalizeProxiedPath(external);

  for (const { from, to } of PROXY_PREFIXES) {
    if (external.startsWith(from)) {
      return normalizeProxiedPath(`${to}${external.slice(from.length)}`);
    }
  }
  return external;
}

/** Absolute URL on this site (for share links). */
export function proxyUrl(external: string): string {
  const path = proxyPath(external);
  if (path.startsWith("/")) {
    const origin = siteOrigin();
    return origin ? `${origin}${path}` : path;
  }
  return path;
}

export function localGamePath(slug: string): string | undefined {
  const rel = LOCAL[slug];
  if (!rel) return undefined;
  if (rel.startsWith("/games/")) return rel;
  return `/games/${rel.replace(/^\//, "")}`;
}

/** True when the play URL is served under Polygons (not a third-party tab). */
export function isSameOriginPlayPath(pathOrUrl: string): boolean {
  if (pathOrUrl.startsWith("/")) return true;
  if (!siteOrigin()) return false;
  return pathOrUrl.startsWith(siteOrigin());
}
