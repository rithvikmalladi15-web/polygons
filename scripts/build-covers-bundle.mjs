/**
 * Build src/data/covers-bundle.json + covers-remote.json + covers-candidates.json
 * for all 100 saved-bundle slugs.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ABC = "https://abc.cloudfree.jp/";

const teen = JSON.parse(readFileSync(resolve(root, "src/data/curated-bundle.json"), "utf8"));
const slugs = teen.teenTop100.games.map((g) => g.slug);

const allCovers = JSON.parse(readFileSync(resolve(root, "src/data/covers.json"), "utf8"));
const overrides = JSON.parse(readFileSync(resolve(root, "src/data/cover-overrides.json"), "utf8"));

const sources = [
  "src/classics/spotlight.ts",
  "src/classics/teen-top-picks.ts",
  "src/classics/famous-web.ts",
  "src/classics/mobile-browser.ts",
  "src/classics/classics-retro.ts",
  "src/classics/coolmath.ts",
  "src/classics/unblock-abc.ts",
];

/** @type {Map<string, { gdId?: string, thumbUrl?: string, abcPath?: string, directUrl?: string }>} */
const meta = new Map();

function ingestFile(text) {
  for (const m of text.matchAll(/"slug":\s*"([^"]+)"[\s\S]*?"gdId":\s*"([^"]+)"/g)) {
    meta.set(m[1], { gdId: m[2].toLowerCase(), ...meta.get(m[1]) });
  }
  for (const m of text.matchAll(/slug:\s*"([^"]+)"[\s\S]*?gdId:\s*"([^"]+)"/g)) {
    const prev = meta.get(m[1]) ?? {};
    if (!prev.gdId) meta.set(m[1], { ...prev, gdId: m[2].toLowerCase() });
  }
  for (const m of text.matchAll(/"slug":\s*"([^"]+)"[\s\S]*?"thumbUrl":\s*"([^"]+)"/g)) {
    const prev = meta.get(m[1]) ?? {};
    meta.set(m[1], { ...prev, thumbUrl: m[2] });
  }
  for (const m of text.matchAll(/slug:\s*"([^"]+)"[\s\S]*?thumbUrl:\s*"([^"]+)"/g)) {
    const prev = meta.get(m[1]) ?? {};
    if (!prev.thumbUrl) meta.set(m[1], { ...prev, thumbUrl: m[2] });
  }
  for (const m of text.matchAll(/"slug":\s*"([^"]+)"[\s\S]*?"abcPath":\s*"([^"]+)"/g)) {
    const prev = meta.get(m[1]) ?? {};
    meta.set(m[1], { ...prev, abcPath: m[2] });
  }
  for (const m of text.matchAll(/slug:\s*"([^"]+)"[\s\S]*?abcPath:\s*"([^"]+)"/g)) {
    const prev = meta.get(m[1]) ?? {};
    if (!prev.abcPath) meta.set(m[1], { ...prev, abcPath: m[2] });
  }
  for (const m of text.matchAll(/"slug":\s*"([^"]+)"[\s\S]*?"directUrl":\s*"([^"]+)"/g)) {
    const prev = meta.get(m[1]) ?? {};
    meta.set(m[1], { ...prev, directUrl: m[2] });
  }
  for (const m of text.matchAll(/slug:\s*"([^"]+)"[\s\S]*?directUrl:\s*"([^"]+)"/g)) {
    const prev = meta.get(m[1]) ?? {};
    if (!prev.directUrl) meta.set(m[1], { ...prev, directUrl: m[2] });
  }
  for (const m of text.matchAll(/gd\(\s*"([^"]+)"[\s\S]*?"([a-f0-9]{32})"[\s\S]*?\n\s*\),/g)) {
    const slug = m[1];
    const gdId = m[2].toLowerCase();
    const prev = meta.get(slug) ?? {};
    if (!prev.gdId) meta.set(slug, { ...prev, gdId });
  }
  for (const m of text.matchAll(/teen\(\s*"([^"]+)"[\s\S]*?"([a-f0-9]{32})"[\s\S]*?\n\s*\),/g)) {
    const slug = m[1];
    const gdId = m[2].toLowerCase();
    const prev = meta.get(slug) ?? {};
    if (!prev.gdId) meta.set(slug, { ...prev, gdId });
  }
  for (const m of text.matchAll(/web\(\s*"([^"]+)"[\s\S]*?"(https?:\/\/[^"]+)"[\s\S]*?\n\s*\),/g)) {
    const slug = m[1];
    const directUrl = m[2];
    const prev = meta.get(slug) ?? {};
    if (!prev.directUrl) meta.set(slug, { ...prev, directUrl });
  }
}

for (const rel of sources) {
  ingestFile(readFileSync(resolve(root, rel), "utf8"));
}

function gdThumbUrls(gdId) {
  const id = gdId.replace(/\/$/, "").match(/[a-f0-9]{32}/i)?.[0]?.toLowerCase();
  if (!id) return [];
  return [
    `https://img.gamedistribution.com/${id}-512x384.jpeg`,
    `https://img.gamedistribution.com/${id}-512x512.jpeg`,
    `https://img.gamedistribution.com/${id}-512x384.jpg`,
  ];
}

function abcBaseFromPath(abcPath) {
  const dir = abcPath.replace(/\/index\.html$/i, "").replace(/\/$/, "");
  return `${ABC}${dir}/`;
}

function pickAbcImage(html, baseUrl) {
  const og = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (og?.[1] && !/url_example|placeholder/i.test(og[1])) {
    return new URL(og[1], baseUrl).href;
  }

  const icons = [];
  for (const m of html.matchAll(/src=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["']/gi)) {
    icons.push(m[1]);
  }
  for (const m of html.matchAll(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/gi)) {
    icons.push(m[1]);
  }
  for (const m of html.matchAll(/href=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi)) {
    icons.push(m[1]);
  }

  const scored = icons.map((href) => {
    const lower = href.toLowerCase();
    let score = 0;
    if (/tunnel|banner|cover|thumb|splash|poster|logo/.test(lower)) score += 10;
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) score += 5;
    if (lower.includes("red.png")) score -= 5;
    return { href, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored.find((s) => s.score > 0) ?? scored[0];
  if (!best) return undefined;
  return new URL(best.href, baseUrl).href;
}

function abcPageUrl(abcPath) {
  if (/^[^/]+\.html$/i.test(abcPath)) return `${ABC}${abcPath}`;
  return `${abcBaseFromPath(abcPath)}index.html`;
}

async function discoverAbcThumb(abcPath) {
  const pageUrl = abcPageUrl(abcPath);
  const baseUrl = new URL(".", pageUrl).href;
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": "PolygonsCoverBot/1.0" },
    });
    if (!res.ok) return undefined;
    const html = await res.text();
    const gdGame = html.match(/gameId:\s*"([a-f0-9]{32})"/i)?.[1]?.toLowerCase();
    if (gdGame) return gdThumbUrls(gdGame)[0];
    return pickAbcImage(html, baseUrl);
  } catch {
    return undefined;
  }
}

function aliasCover(slug) {
  const alias = slug.replace(/^unblock-/, "");
  return allCovers[slug] ?? allCovers[alias] ?? allCovers[`gd-${alias}`];
}

function expandThumbUrl(url) {
  if (!url?.includes("img.gamedistribution.com")) return url ? [url] : [];
  const id = url.match(/[a-f0-9]{32}/i)?.[0]?.toLowerCase();
  if (!id) return [url];
  return gdThumbUrls(id);
}

/** @type {Record<string, string[]>} */
const candidateMap = {};

for (const slug of slugs) {
  const list = [];
  const m = meta.get(slug) ?? {};

  if (overrides[slug]?.length) list.push(...overrides[slug]);

  const alias = aliasCover(slug);
  if (alias) list.push(...expandThumbUrl(alias));
  if (!list.length) {
    const aliasKey = slug.replace(/^unblock-/, "");
    for (const [key, url] of Object.entries(allCovers)) {
      if (key.includes(aliasKey) && key.length < aliasKey.length + 12) {
        list.push(...expandThumbUrl(url));
      }
    }
  }

  if (m.thumbUrl) list.push(...expandThumbUrl(m.thumbUrl));
  if (m.gdId) list.push(...gdThumbUrls(m.gdId));

  if (m.abcPath) {
    const discovered = await discoverAbcThumb(m.abcPath);
    if (discovered) list.push(discovered);
  }

  if (m.directUrl) {
    try {
      const res = await fetch(m.directUrl, { headers: { "User-Agent": "PolygonsCoverBot/1.0" } });
      if (res.ok) {
        const html = await res.text();
        const art = pickAbcImage(html, m.directUrl);
        if (art) list.push(art);
      }
    } catch {
      /* optional */
    }
  }

  const seen = new Set();
  candidateMap[slug] = list.filter((u) => {
    if (!u || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

const manifest = {};
const remote = {};
const coversDir = resolve(root, "public/covers");

for (const slug of slugs) {
  const local = `/covers/${slug}.jpg`;
  const dest = resolve(coversDir, `${slug}.jpg`);
  const hasLocal = existsSync(dest) && statSync(dest).size > 1000;
  manifest[slug] = hasLocal ? local : (candidateMap[slug][0] ?? local);
  if (candidateMap[slug][0]) remote[slug] = candidateMap[slug][0];
}

writeFileSync(resolve(root, "src/data/covers-bundle.json"), JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(resolve(root, "src/data/covers-remote.json"), JSON.stringify(remote, null, 2) + "\n");
writeFileSync(
  resolve(root, "src/data/covers-candidates.json"),
  JSON.stringify(candidateMap, null, 2) + "\n",
);

const withArt = Object.values(candidateMap).filter((c) => c.length > 0).length;
console.log(
  `covers-bundle: ${slugs.length} slugs; ${withArt} with remote candidates; ${Object.keys(remote).length} primary remotes`,
);
