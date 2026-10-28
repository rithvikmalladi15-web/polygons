/**
 * Mirror saved-bundle games (teen top 100) that use abc.cloudfree.jp into public/games/.
 * Run: npm run games:mirror
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gamesDir = resolve(root, "public/games");
const manifestPath = resolve(root, "src/data/local-games.json");
const bundlePath = resolve(root, "src/data/curated-bundle.json");
const abcPath = resolve(root, "src/classics/unblock-abc.ts");

const args = new Set(process.argv.slice(2));
const skipExisting = args.has("--skip-existing");

function loadAbcBySlug() {
  const text = readFileSync(abcPath, "utf8");
  const map = new Map();
  const blockRe = /\{[^{}]*"slug":\s*"([^"]+)"[^{}]*"abcPath":\s*"([^"]+)"[^{}]*\}/g;
  let m;
  while ((m = blockRe.exec(text)) !== null) {
    map.set(m[1], m[2]);
  }
  return map;
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

const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));
const teenSlugs = bundle.teenTop100.games.map((g) => g.slug);
const abcBySlug = loadAbcBySlug();

mkdirSync(gamesDir, { recursive: true });
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const jobs = teenSlugs
  .filter((slug) => abcBySlug.has(slug))
  .map((slug) => ({ slug, folder: abcBySlug.get(slug).replace(/\/index\.html$/i, "").replace(/^\//, "") }));

console.log(`Mirroring ${jobs.length} abc-backed games from saved bundle (of ${teenSlugs.length} total)`);

for (const { slug, folder } of jobs) {
  const dest = resolve(gamesDir, slug);
  const index = resolve(dest, "index.html");
  if (skipExisting && existsSync(index)) {
    manifest[slug] = `${slug}/index.html`;
    console.log(`skip ${slug}`);
    continue;
  }

  const url = `https://abc.cloudfree.jp/${folder}/`;
  console.log(`mirror ${slug} ← ${url}`);
  mkdirSync(dest, { recursive: true });
  try {
    execSync(`wget -q -r -np -nH --cut-dirs=1 -P "${dest}" "${url}"`, { stdio: "inherit", cwd: root });
  } catch {
    console.warn(`  wget failed for ${slug}`);
  }

  if (existsSync(index)) manifest[slug] = `${slug}/index.html`;
  else if (existsSync(resolve(dest, folder, "index.html"))) {
    manifest[slug] = `${slug}/${folder}/index.html`;
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Updated ${manifestPath}`);
