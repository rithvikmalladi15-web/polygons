/**
 * Find https origins in classics sources; append missing entries to embed-proxy-routes.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routesPath = resolve(root, "src/data/embed-proxy-routes.json");
const routes = JSON.parse(readFileSync(routesPath, "utf8"));
const knownFrom = new Set(routes.map((r) => r.from));

const files = [
  "src/classics/spotlight.ts",
  "src/classics/teen-top-picks.ts",
  "src/classics/famous-web.ts",
  "src/classics/mobile-browser.ts",
  "src/classics/classics-retro.ts",
  "src/classics/coolmath.ts",
  "src/classics/unblock-abc.ts",
];

const urls = new Set();
for (const rel of files) {
  const text = readFileSync(resolve(root, rel), "utf8");
  for (const m of text.matchAll(/https?:\/\/[^"'`\s)]+/g)) {
    let u = m[0].replace(/\\$/, "");
    if (u.includes("${")) continue;
    urls.add(u);
  }
}

function originPrefix(url) {
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/" || parsed.pathname === "") {
      return `${parsed.origin}/`;
    }
    return url.endsWith("/") ? url : `${url}/`;
  } catch {
    return null;
  }
}

function slugFromHost(host) {
  return host.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 32);
}

let added = 0;
for (const url of urls) {
  const prefix = originPrefix(url);
  if (!prefix) continue;
  if (prefix.includes("abc.cloudfree.jp") || prefix.includes("gamedistribution.com") || prefix.includes("irv77.github.io")) {
    continue;
  }
  const already = [...knownFrom].some((f) => prefix.startsWith(f) || f.startsWith(prefix));
  if (already) continue;

  const parsed = new URL(prefix);
  const mount = `/_ext/${slugFromHost(parsed.hostname)}/`;
  if (knownFrom.has(prefix)) continue;

  routes.push({
    id: slugFromHost(parsed.hostname),
    from: prefix,
    to: mount,
    target: parsed.origin,
  });
  knownFrom.add(prefix);
  added++;
  console.log("discover +", prefix, "→", mount);
}

if (added) {
  writeFileSync(routesPath, JSON.stringify(routes, null, 2) + "\n");
  console.log(`Added ${added} proxy host(s). Run npm run proxy:sync`);
} else {
  console.log("No new hosts discovered.");
}
