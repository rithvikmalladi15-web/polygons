/**
 * Verify all 100 bundle games have a working proxied embed on production.
 * Usage: SITE=https://polygons2.vercel.app npm run verify:live
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = (process.env.SITE ?? "https://polygons2.vercel.app").replace(/\/$/, "");

const { CLASSICS } = await import(pathToFileURL(resolve(root, "src/classics/index.ts")).href);
const { classicEmbedCandidates } = await import(pathToFileURL(resolve(root, "src/lib/embed.ts")).href);

async function checkPath(path) {
  const url = `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const vercelErr = res.headers.get("x-vercel-error");
    const ok = res.ok && vercelErr !== "NOT_FOUND";
    return { url, status: res.status, ok, vercelErr };
  } catch (e) {
    return { url, status: 0, ok: false, err: String(e) };
  }
}

async function checkGame(game) {
  const candidates = classicEmbedCandidates(game);
  if (!candidates.length) return { slug: game.slug, issue: "no candidates" };
  for (const path of candidates) {
    const r = await checkPath(path);
    if (r.ok) return { slug: game.slug, ok: true, path, status: r.status };
  }
  const first = await checkPath(candidates[0]);
  return { slug: game.slug, ok: false, paths: candidates.slice(0, 3), ...first };
}

const results = [];
let badPaths = 0;
for (const game of CLASSICS) {
  for (const path of classicEmbedCandidates(game)) {
    if (path.includes("/_gd/embed/?")) {
      badPaths++;
      console.log(JSON.stringify({ slug: game.slug, issue: "broken gd embed path", path }));
    }
  }
  results.push(await checkGame(game));
}

if (badPaths) {
  console.error(`Broken embed paths: ${badPaths}`);
  process.exit(1);
}

const bad = results.filter((r) => !r.ok);
let offSite = 0;
for (const game of CLASSICS) {
  const paths = classicEmbedCandidates(game);
  if (!paths.length || !paths.every((p) => p.startsWith("/"))) {
    offSite++;
    console.log(JSON.stringify({ slug: game.slug, issue: "not same-origin", paths: paths.slice(0, 3) }));
  }
}
if (offSite) {
  console.error(`Same-origin check failed for ${offSite} games`);
  process.exit(1);
}

console.log(`SITE ${SITE} — OK ${results.length - bad.length}/${CLASSICS.length}, FAIL ${bad.length}`);
for (const r of bad) console.log(JSON.stringify(r));

process.exit(bad.length ? 1 : 0);
