/**
 * Download cover JPEGs into public/covers/ from covers-candidates.json.
 * Usage: npm run covers:fetch
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/covers");
const candidates = JSON.parse(
  readFileSync(resolve(root, "src/data/covers-candidates.json"), "utf8"),
);

mkdirSync(outDir, { recursive: true });

const FETCH_HEADERS = {
  Referer: "https://html5.gamedistribution.com/",
  "User-Agent": "PolygonsCoverBot/1.0",
};

let ok = 0;
let skip = 0;
let fail = 0;

for (const [slug, urls] of Object.entries(candidates)) {
  const dest = resolve(outDir, `${slug}.jpg`);
  if (existsSync(dest) && statSync(dest).size > 1000) {
    skip++;
    continue;
  }

  const list = Array.isArray(urls) ? urls : [];
  let saved = false;
  for (const url of list) {
    if (!url?.startsWith("http")) continue;
    try {
      const res = await fetch(url, { headers: FETCH_HEADERS });
      if (!res.ok || !res.body) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 800) continue;
      writeFileSync(dest, buf);
      if (statSync(dest).size > 800) {
        saved = true;
        ok++;
        break;
      }
    } catch {
      /* try next candidate */
    }
  }
  if (!saved) fail++;
}

console.log(
  `fetch-covers: ${ok} downloaded, ${skip} skipped, ${fail} failed (${Object.keys(candidates).length} total)`,
);
