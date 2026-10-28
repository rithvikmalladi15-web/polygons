import { CLASSICS_RETRO } from "./classics-retro";
import { COOLMATH_PICKS } from "./coolmath";
import { FAMOUS_WEB } from "./famous-web";
import { MOBILE_BROWSER } from "./mobile-browser";
import { SPOTLIGHT } from "./spotlight";
import { UNBLOCK_ABC } from "./unblock-abc";
import { TEEN_TOP_PICKS } from "./teen-top-picks";
import { TEEN_TOP_100 } from "./curated-bundle";
import { classicEmbedSrc as resolveEmbedSrc } from "../lib/embed";
import type { ClassicGame, ClassicShelf } from "./types";

export { classicEmbedCandidates, classicExternalPlayUrl, classicSameOriginPlayerUrl } from "../lib/embed";

export type { ClassicGame, ClassicShelf } from "./types";

/** Polygons only ships the curated saved bundle (100 titles), not the full GD catalog. */
function buildGameLookup(): Map<string, ClassicGame> {
  const seen = new Set<string>();
  const bySlug = new Map<string, ClassicGame>();

  const add = (game: ClassicGame) => {
    if (seen.has(game.slug)) return;
    seen.add(game.slug);
    bySlug.set(game.slug, game);
  };

  for (const game of SPOTLIGHT) add(game);
  for (const game of TEEN_TOP_PICKS) add(game);
  for (const game of FAMOUS_WEB) add(game);
  for (const game of MOBILE_BROWSER) add(game);
  for (const game of CLASSICS_RETRO) add(game);
  for (const game of COOLMATH_PICKS) add(game);
  for (const game of UNBLOCK_ABC) add(game);

  return bySlug;
}

function mergeCatalog(): ClassicGame[] {
  const lookup = buildGameLookup();
  const out: ClassicGame[] = [];
  const missing: string[] = [];

  for (const row of TEEN_TOP_100) {
    const game = lookup.get(row.slug);
    if (game) out.push(game);
    else missing.push(row.slug);
  }

  if (missing.length > 0 && import.meta.env.DEV) {
    console.warn("[polygons] saved bundle missing slugs:", missing);
  }

  return out;
}

export const CLASSICS = mergeCatalog();

export { SPOTLIGHT } from "./spotlight";
export { ABC_CLOUDFREE_GAMES, TEEN_TOP_100 } from "./curated-bundle";

const BY_SLUG = new Map(CLASSICS.map((game) => [game.slug, game]));

export function classicBySlug(slug: string): ClassicGame | undefined {
  return BY_SLUG.get(slug);
}

export function classicPageUrl(slug: string): string {
  return `${location.origin}/hit/${slug}`;
}

export function classicEmbedSrc(game: ClassicGame): string {
  return resolveEmbedSrc(game);
}

export function filterClassics(query: string, shelf?: ClassicShelf | "all"): ClassicGame[] {
  const q = query.trim().toLowerCase();
  let base = CLASSICS;
  if (shelf && shelf !== "all") base = base.filter((game) => game.shelf === shelf);
  if (!q || q.length < 2) return base;
  return base.filter((game) => {
    if (game.name.toLowerCase().includes(q)) return true;
    if (game.line.toLowerCase().includes(q)) return true;
    return game.tags.some((tag) => tag.includes(q));
  });
}

export function classicCount(shelf?: ClassicShelf | "all"): number {
  if (!shelf || shelf === "all") return CLASSICS.length;
  return CLASSICS.filter((game) => game.shelf === shelf).length;
}

export function randomClassicSlug(): string {
  const index = Math.floor(Math.random() * CLASSICS.length);
  return CLASSICS[index]?.slug ?? SPOTLIGHT[0].slug;
}

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 2);
}

function scoreRelated(current: ClassicGame, candidate: ClassicGame): number {
  let score = 0;
  if (candidate.shelf === current.shelf) score += 12;
  const currentTags = new Set(current.tags.map((tag) => tag.toLowerCase()));
  for (const tag of candidate.tags) {
    if (currentTags.has(tag.toLowerCase())) score += 4;
  }
  const tokens = new Set(nameTokens(current.name));
  for (const token of nameTokens(candidate.name)) {
    if (tokens.has(token)) score += 2;
  }
  return score;
}

export function recommendGames(current: ClassicGame, limit = 10): ClassicGame[] {
  const picked: ClassicGame[] = [];
  const seen = new Set<string>([current.slug]);

  const ranked = CLASSICS
    .filter((game) => game.slug !== current.slug)
    .map((game) => ({ game, score: scoreRelated(current, game) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const row of ranked) {
    if (picked.length >= limit) break;
    if (seen.has(row.game.slug)) continue;
    seen.add(row.game.slug);
    picked.push(row.game);
  }

  const fill = CLASSICS;
  for (const game of fill) {
    if (picked.length >= limit) break;
    if (seen.has(game.slug)) continue;
    seen.add(game.slug);
    picked.push(game);
  }

  return picked.slice(0, limit);
}

/** Resolves the curated teen top-100 list to catalog entries (skips missing slugs). */
export function teenTop100Games(): ClassicGame[] {
  const out: ClassicGame[] = [];
  const seen = new Set<string>();
  for (const row of TEEN_TOP_100) {
    const game = BY_SLUG.get(row.slug);
    if (!game || seen.has(game.slug)) continue;
    seen.add(game.slug);
    out.push(game);
  }
  return out;
}

export function curatedHomePicks(limit = 8): ClassicGame[] {
  return teenTop100Games().slice(0, limit);
}
