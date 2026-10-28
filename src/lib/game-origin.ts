import localGames from "../data/local-games.json";

const LOCAL = localGames as Record<string, string>;

/** External URL prefixes rewritten to same-origin paths (see vercel.json + vite proxy). */
const PROXY_PREFIXES: { from: string; to: string }[] = [
  { from: "https://html5.gamedistribution.com/", to: "/_gd/html5/" },
  { from: "https://embed.gamedistribution.com/", to: "/_gd/embed/" },
  { from: "https://img.gamedistribution.com/", to: "/_gd/img/" },
  { from: "https://abc.cloudfree.jp/", to: "/_abc/" },
  { from: "https://staticquasar931.github.io/slope/", to: "/_ext/slope/" },
  { from: "https://crazy-cattle.github.io/iframe/", to: "/_ext/crazy-cattle/" },
  { from: "https://1v1lol-free.github.io/", to: "/_ext/1v1lol/" },
  { from: "https://irv77.github.io/hd_fnaf/", to: "/_ext/fnaf/" },
  { from: "https://playgeckogames.github.io/games/game11/", to: "/_ext/gecko11/" },
  { from: "https://htmlxm.github.io/h3/tube-jumpers", to: "/_ext/tube-jumpers" },
  { from: "https://cdn.nitrome.com/html5-games/badicecream/", to: "/_ext/nitrome/badicecream/" },
  { from: "https://cdn.nitrome.com/html5-games/badicecream2/", to: "/_ext/nitrome/badicecream2/" },
  { from: "https://geometrydash-lite.io/", to: "/_ext/geometrydash-lite/" },
  { from: "https://driftboss-free.github.io/g/brawl-stars/", to: "/_ext/brawl-stars/" },
  { from: "https://pokemon-emerald.github.io/", to: "/_ext/pokemon-emerald/" },
  { from: "https://scratch.mit.edu/projects/105500895/embed", to: "/_ext/scratch-gd/embed" },
];

export function siteOrigin(): string {
  if (typeof location !== "undefined") return location.origin;
  return "";
}

/** Route third-party asset URLs through Polygons (same tab, same origin). */
export function proxyUrl(external: string): string {
  if (!external || external.startsWith("/")) return external;
  const origin = siteOrigin();
  if (!origin) return external;

  for (const { from, to } of PROXY_PREFIXES) {
    if (external.startsWith(from)) {
      return `${origin}${to}${external.slice(from.length)}`;
    }
  }
  return external;
}

export function localGamePath(slug: string): string | undefined {
  const rel = LOCAL[slug];
  if (!rel) return undefined;
  if (rel.startsWith("/games/")) return rel;
  return `/games/${rel.replace(/^\//, "")}`;
}
