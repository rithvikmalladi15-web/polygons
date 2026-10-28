/**
 * Quick HEAD checks for curated (non-catalog) embed URLs.
 * Run: node scripts/verify-embeds.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ABC = "https://abc.cloudfree.jp/";

function extractGames(ts, kind) {
  const out = [];
  if (kind === "abc") {
    for (const m of ts.matchAll(/"abcPath":\s*"([^"]+)"/g)) {
      out.push({ type: "abc", url: ABC + m[1] });
    }
  }
  if (kind === "direct") {
    for (const m of ts.matchAll(/directUrl:\s*"([^"]+)"/g)) {
      out.push({ type: "direct", url: m[1] });
    }
    for (const m of ts.matchAll(/"directUrl":\s*"([^"]+)"/g)) {
      out.push({ type: "direct", url: m[1] });
    }
  }
  return out;
}

const files = [
  "src/classics/spotlight.ts",
  "src/classics/famous-web.ts",
  "src/classics/mobile-browser.ts",
  "src/classics/classics-retro.ts",
  "src/classics/coolmath.ts",
  "src/classics/unblock-abc.ts",
];

const items = [];
for (const f of files) {
  const ts = readFileSync(resolve(root, f), "utf8");
  items.push(...extractGames(ts, "abc").map((x) => ({ ...x, file: f })));
  items.push(...extractGames(ts, "direct").map((x) => ({ ...x, file: f })));
}

const unique = [...new Map(items.map((i) => [i.url, i])).values()];

async function check(item) {
  try {
    const res = await fetch(item.url, { method: "HEAD", redirect: "follow" });
    const xfo = res.headers.get("x-frame-options") || "";
    const csp = res.headers.get("content-security-policy") || "";
    const blocked = /deny|sameorigin/i.test(xfo) || /frame-ancestors\s+'none'/i.test(csp);
    return { ...item, status: res.status, blocked, ok: res.ok && !blocked };
  } catch (e) {
    return { ...item, status: 0, blocked: true, ok: false, err: String(e) };
  }
}

const results = [];
for (const item of unique) {
  results.push(await check(item));
}

const bad = results.filter((r) => !r.ok);
console.log(`Checked ${results.length} URLs — ${bad.length} problems\n`);
for (const r of bad) {
  console.log(`${r.status} ${r.blocked ? "XFO/CSP" : ""} ${r.type} ${r.url}`);
  console.log(`  (${r.file})\n`);
}
