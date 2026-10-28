import { CLASSICS_RETRO } from "./classics-retro";
import { COOLMATH_PICKS } from "./coolmath";
import { FAMOUS_WEB } from "./famous-web";
import { MOBILE_BROWSER } from "./mobile-browser";
import { GD_CATALOG } from "./gd-catalog";
import { SPOTLIGHT } from "./spotlight";
import { UNBLOCK_ABC } from "./unblock-abc";
import type { ClassicGame, ClassicShelf } from "./types";

export type { ClassicGame, ClassicShelf } from "./types";

const ABC_BASE = "https://abc.cloudfree.jp/";

function mergeCatalog(): ClassicGame[] {
  const seen = new Set<string>();
  const seenAbcPath = new Set<string>();
  const out: ClassicGame[] = [];
  const add = (game: ClassicGame) => {
    if (seen.has(game.slug)) return;
    if (game.abcPath) {
      if (seenAbcPath.has(game.abcPath)) return;
      seenAbcPath.add(game.abcPath);
    }
    seen.add(game.slug);
    out.push(game);
  };
  for (const game of SPOTLIGHT) add(game);
  for (const game of FAMOUS_WEB) add(game);
  for (const game of MOBILE_BROWSER) add(game);
  for (const game of CLASSICS_RETRO) add(game);
  for (const game of COOLMATH_PICKS) add(game);
  for (const game of UNBLOCK_ABC) add(game);
  for (const game of GD_CATALOG) add(game);
  return out;
}

export const CLASSICS = mergeCatalog();

export { SPOTLIGHT } from "./spotlight";

const BY_SLUG = new Map(CLASSICS.map((game) => [game.slug, game]));

export function classicBySlug(slug: string): ClassicGame | undefined {
  return BY_SLUG.get(slug);
}

export function classicPageUrl(slug: string): string {
  return `${location.origin}/hit/${slug}`;
}

export function classicEmbedSrc(game: ClassicGame): string {
  const page = classicPageUrl(game.slug);
  if (game.abcPath) return `${ABC_BASE}${game.abcPath}`;
  if (game.directUrl) return game.directUrl;
  if (game.gdId) {
    const path = game.gdId.endsWith("/") ? game.gdId : `${game.gdId}/`;
    return `https://html5.gamedistribution.com/${path}?gd_sdk_referrer_url=${encodeURIComponent(page)}`;
  }
  return "";
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

  const fill = [...SPOTLIGHT, ...CLASSICS];
  for (const game of fill) {
    if (picked.length >= limit) break;
    if (seen.has(game.slug)) continue;
    seen.add(game.slug);
    picked.push(game);
  }

  return picked.slice(0, limit);
}

export function curatedHomePicks(limit = 8): ClassicGame[] {
  const out: ClassicGame[] = [];
  const seen = new Set<string>();

  for (const game of SPOTLIGHT) {
    if (out.length >= limit) break;
    if (seen.has(game.slug)) continue;
    seen.add(game.slug);
    out.push(game);
  }

  const shelves: ClassicShelf[] = ["famous", "coolmath", "unblock"];
  for (const shelf of shelves) {
    for (const game of CLASSICS) {
      if (out.length >= limit) break;
      if (game.shelf !== shelf || seen.has(game.slug)) continue;
      seen.add(game.slug);
      out.push(game);
    }
  }

  return out.slice(0, limit);
}
