import covers from "../data/covers-bundle.json";
import candidates from "../data/covers-candidates.json";
import overrides from "../data/cover-overrides.json";
import type { ClassicGame } from "../classics/types";
import { gdThumbUrls } from "./gd-thumb";
import { posterDataUrl } from "./thumbFallback";

const COVERS = covers as Record<string, string>;
const CANDIDATES = candidates as Record<string, string[]>;
const OVERRIDES = overrides as Record<string, string[]>;

function unique(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/** Ordered URLs to try for a library card (local first, then CDN / ABC art). */
export function gameThumbCandidates(game: ClassicGame): string[] {
  const list: string[] = [];

  const bundled = COVERS[game.slug];
  if (bundled?.startsWith("/")) list.push(bundled);
  if (bundled?.startsWith("http")) list.push(bundled);

  const built = CANDIDATES[game.slug];
  if (built?.length) list.push(...built);
  if (OVERRIDES[game.slug]?.length) list.push(...OVERRIDES[game.slug]);

  if (game.thumbUrl) list.push(game.thumbUrl);
  if (game.gdId) list.push(...gdThumbUrls(game.gdId));

  list.push(posterDataUrl(game.name, game.slug));

  return unique(list);
}

export function gameThumbUrl(game: ClassicGame): string {
  return gameThumbCandidates(game)[0] ?? posterDataUrl(game.name, game.slug);
}
