/**
 * Writes src/data/curated-bundle.json from curated-bundle.ts (via dynamic import).
 * Run: node scripts/build-curated-bundle.mjs
 */
import { execSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Parse ABC + teen lists from TS without full compile (regex on source files).
const abcText = readFileSync(resolve(root, "src/classics/unblock-abc.ts"), "utf8");
const teenText = readFileSync(resolve(root, "src/classics/curated-bundle.ts"), "utf8");

const abcGames = [];
const abcRe = /"slug":\s*"([^"]+)"[\s\S]*?"name":\s*"([^"]+)"[\s\S]*?"abcPath":\s*"([^"]+)"/g;
let m;
while ((m = abcRe.exec(abcText)) !== null) {
  abcGames.push({ slug: m[1], name: m[2], abcPath: m[3] });
}

const teenTop100 = [];
const teenRe = /\{\s*rank:\s*(\d+),\s*name:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*host:\s*"([^"]+)"\s*\}/g;
while ((m = teenRe.exec(teenText)) !== null) {
  teenTop100.push({ rank: Number(m[1]), name: m[2], slug: m[3], host: m[4] });
}

const out = {
  updated: new Date().toISOString().slice(0, 10),
  note: "abc.cloudfree.jp UNBLOCK staples + Coolmath-class hits + GD classics. Brainrot/meme clones excluded.",
  abcCloudfree: { count: abcGames.length, games: abcGames },
  teenTop100: { count: teenTop100.length, games: teenTop100 },
};

writeFileSync(resolve(root, "src/data/curated-bundle.json"), JSON.stringify(out, null, 2) + "\n");

console.log(`Wrote ${abcGames.length} ABC + ${teenTop100.length} teen picks → curated-bundle.json`);
execSync("node scripts/build-covers-bundle.mjs", { stdio: "inherit", cwd: root });
