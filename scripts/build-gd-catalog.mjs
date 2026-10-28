/**
 * Fetches ~1000 playable GameDistribution titles into src/data/gd-catalog.json.
 * Run: node scripts/build-gd-catalog.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BUILD_ID = "HEAXcJWB96CtSwVF5DYig";
const TARGET = 1000;
const MAX_TRIES = 12000;
const CONCURRENCY = 12;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../src/data/gd-catalog.json");

const xml = await fetch("https://gamedistribution.com/sitemap-games-1.xml").then((r) => r.text());
const slugs = [...xml.matchAll(/<loc>https:\/\/gamedistribution\.com\/games\/([^/]+)\/<\/loc>/g)]
  .map((m) => m[1])
  .slice(0, MAX_TRIES);

async function fetchMeta(slug) {
  const url = `https://gamedistribution.com/_next/data/${BUILD_ID}/games/${slug}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const g = data?.pageProps?.game;
    if (!g?.md5 || !g?.title) return null;
    const w = Number(g.width) || 800;
    const h = Number(g.height) || 600;
    if (w < 200 || h < 200) return null;
    return {
      slug: `gd-${slug}`,
      name: String(g.title).trim(),
      gdId: g.md5,
      width: w,
      height: h,
      tags: Array.isArray(g.tags) ? g.tags.slice(0, 6).map(String) : [],
    };
  } catch {
    return null;
  }
}

const games = [];
let i = 0;

async function worker() {
  while (games.length < TARGET && i < slugs.length) {
    const slug = slugs[i++];
    const meta = await fetchMeta(slug);
    if (meta) games.push(meta);
    if (games.length % 50 === 0 && games.length > 0) {
      process.stdout.write(`\r${games.length} games…`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

process.stdout.write(`\nWrote ${games.length} games\n`);
mkdirSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/data"), { recursive: true });
writeFileSync(OUT, JSON.stringify({ version: 1, count: games.length, games }, null, 0));
