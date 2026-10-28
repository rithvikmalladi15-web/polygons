/**
 * List bundle embed URLs that are not covered by PROXY_PREFIXES.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const teen = JSON.parse(readFileSync(resolve(root, "src/data/curated-bundle.json"), "utf8")).teenTop100.games.map(
  (g) => g.slug,
);

const proxyText = readFileSync(resolve(root, "src/lib/proxy-routes.ts"), "utf8");
const froms = [...proxyText.matchAll(/from:\s*"([^"]+)"/g)].map((m) => m[1]).sort((a, b) => b.length - a.length);

function proxied(url) {
  return froms.some((f) => url.startsWith(f));
}

const sources = [
  "src/classics/spotlight.ts",
  "src/classics/teen-top-picks.ts",
  "src/classics/famous-web.ts",
  "src/classics/mobile-browser.ts",
  "src/classics/classics-retro.ts",
  "src/classics/coolmath.ts",
  "src/classics/unblock-abc.ts",
];

const meta = new Map();
function ingest(text) {
  for (const m of text.matchAll(/"slug":\s*"([^"]+)"[\s\S]*?"abcPath":\s*"([^"]+)"/g)) {
    meta.set(m[1], { ...meta.get(m[1]), abcPath: m[2] });
  }
  for (const m of text.matchAll(/"slug":\s*"([^"]+)"[\s\S]*?"gdId":\s*"([^"]+)"/g)) {
    meta.set(m[1], { ...meta.get(m[1]), gdId: m[2] });
  }
  for (const m of text.matchAll(/slug:\s*"([^"]+)"[\s\S]*?gdId:\s*"([^"]+)"/g)) {
    const p = meta.get(m[1]) ?? {};
    if (!p.gdId) meta.set(m[1], { ...p, gdId: m[2] });
  }
  for (const m of text.matchAll(/web\(\s*"([^"]+)"[\s\S]*?"(https?:\/\/[^"]+)"[\s\S]*?\n\s*\),/g)) {
    meta.set(m[1], { ...meta.get(m[1]), directUrl: m[2] });
  }
  for (const m of text.matchAll(/gd\(\s*"([^"]+)"[\s\S]*?"([a-f0-9]{32})"[\s\S]*?\n\s*\),/g)) {
    const p = meta.get(m[1]) ?? {};
    if (!p.gdId) meta.set(m[1], { ...p, gdId: m[2].toLowerCase() });
  }
}
for (const f of sources) ingest(readFileSync(resolve(root, f), "utf8"));

const retro = readFileSync(resolve(root, "src/classics/classics-retro.ts"), "utf8");
const fnafBase = retro.match(/FNAF_BASE = "([^"]+)"/)?.[1];
for (const m of retro.matchAll(/web\(\s*\n?\s*"([^"]+)"[\s\S]*?\$\{FNAF_BASE\}(\/[^`"]+)/g)) {
  meta.set(m[1], { ...meta.get(m[1]), directUrl: fnafBase + m[2] });
}

const missing = [];
for (const slug of teen) {
  const m = meta.get(slug);
  if (!m) {
    missing.push({ slug, reason: "missing catalog entry" });
    continue;
  }
  if (m.directUrl && !proxied(m.directUrl)) {
    missing.push({ slug, directUrl: m.directUrl });
  }
  if (m.abcPath) {
    const path = m.abcPath.replace(/^\//, "");
    const external = path.endsWith(".html")
      ? `https://abc.cloudfree.jp/${path}`
      : `https://abc.cloudfree.jp/${path.replace(/\/index\.html$/i, "").replace(/\/$/, "")}/`;
    if (!proxied(external)) missing.push({ slug, abc: external });
  }
  if (m.gdId) {
    const id = m.gdId.replace(/\/$/, "");
    const html5 = `https://html5.gamedistribution.com/${id.endsWith("/") ? id : `${id}/`}`;
    const embed = `https://embed.gamedistribution.com/?url=${encodeURIComponent(html5)}`;
    if (!proxied(html5)) missing.push({ slug, gdHtml5: html5 });
    if (!proxied("https://embed.gamedistribution.com/")) missing.push({ slug, gdEmbed: "embed root" });
  }
}

console.log("Bundle slugs:", teen.length);
console.log("Proxy prefixes:", froms.length);
console.log("Issues:", missing.length);
for (const row of missing) console.log(row);
