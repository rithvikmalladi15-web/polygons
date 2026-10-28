/**
 * Mirror UNBLOCK (abc.cloudfree.jp) static games into public/games/ — same idea as abc,
 * but files ship from your Vercel deployment at /games/{slug}/index.html.
 *
 * Requires wget (brew install wget). Vercel Linux builders include wget.
 *
 * Usage:
 *   node scripts/mirror-abc.mjs --catalog              # all UNBLOCK entries in unblock-abc.ts
 *   node scripts/mirror-abc.mjs --catalog --limit 10 # first 10 only
 *   node scripts/mirror-abc.mjs --catalog --skip-existing
 *
 * Updates src/data/local-games.json (slug → path under /games/).
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gamesDir = resolve(root, "public/games");
const manifestPath = resolve(root, "src/data/local-games.json");
const catalogPath = resolve(root, "src/classics/unblock-abc.ts");

const args = new Set(process.argv.slice(2));
const useCatalog = args.has("--catalog");
const skipExisting = args.has("--skip-existing");
const limitArg = process.argv.find((a) => a.startsWith("--limit"));
const limit = limitArg ? Number(limitArg.split("=")[1] ?? process.argv[process.argv.indexOf(limitArg) + 1]) : 0;

/** @type {{ slug: string, abcPath: string }[]} */
function loadAbcCatalog() {
  const text = readFileSync(catalogPath, "utf8");
  const entries = [];
  const blockRe = /\{[^{}]*"slug":\s*"([^"]+)"[^{}]*"abcPath":\s*"([^"]+)"[^{}]*\}/g;
  let m;
  while ((m = blockRe.exec(text)) !== null) {
    entries.push({ slug: m[1], abcPath: m[2] });
  }
  return entries;
}

function abcFolderFromPath(abcPath) {
  return abcPath.replace(/\/index\.html$/i, "").replace(/^\//, "");
}

function hasWget() {
  try {
    execSync("wget --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (!hasWget()) {
  console.error("wget is required. Install with: brew install wget");
  process.exit(1);
}

mkdirSync(gamesDir, { recursive: true });
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

/** @type {{ slug: string, folder: string }[]} */
let jobs = [];

if (useCatalog) {
  jobs = loadAbcCatalog().map(({ slug, abcPath }) => ({
    slug,
    folder: abcFolderFromPath(abcPath),
  }));
} else {
  jobs = [
    { slug: "unblock-flappy-bird", folder: "flappy-bird" },
    { slug: "unblock-2048", folder: "2048" },
    { slug: "unblock-minecraft-classic", folder: "minecraft-classic" },
    { slug: "unblock-tunnel-rush", folder: "tunnel-rush" },
    { slug: "unblock-subway-surfers", folder: "subway-surfers" },
  ];
}

if (limit > 0) jobs = jobs.slice(0, limit);

console.log(`Mirroring ${jobs.length} game(s) into public/games/`);

for (const { slug, folder } of jobs) {
  const dest = resolve(gamesDir, slug);
  const index = resolve(dest, "index.html");
  if (skipExisting && existsSync(index)) {
    manifest[slug] = `${slug}/index.html`;
    console.log(`skip ${slug} (already mirrored)`);
    continue;
  }

  const url = `https://abc.cloudfree.jp/${folder}/`;
  console.log(`mirror ${slug} ← ${url}`);
  mkdirSync(dest, { recursive: true });
  try {
    execSync(`wget -q -r -np -nH --cut-dirs=1 -P "${dest}" "${url}"`, {
      stdio: "inherit",
      cwd: root,
    });
  } catch {
    console.warn(`  wget failed for ${slug}`);
  }

  if (existsSync(index)) {
    manifest[slug] = `${slug}/index.html`;
    console.log(`  ok → /games/${slug}/index.html`);
  } else {
    const nested = resolve(dest, folder, "index.html");
    if (existsSync(nested)) {
      manifest[slug] = `${slug}/${folder}/index.html`;
      console.log(`  ok → /games/${slug}/${folder}/index.html`);
    } else {
      console.warn(`  warn: no index.html for ${slug}`);
    }
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Updated ${manifestPath}`);
