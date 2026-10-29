/** Heuristics for blank frames and school filter block pages (same-origin documents only). */

const BLOCK_PATTERNS = [
  /\baccess denied\b/i,
  /\bweb filter\b/i,
  /\bfortinet\b/i,
  /\blight[s]?peed\b/i,
  /\bgo\/gateway\b/i,
  /\bsecurly\b/i,
  /\bgoguardian\b/i,
  /\bcontentkeeper\b/i,
  /\bnot allowed\b/i,
  /\brequest rejected\b/i,
  /\bthis (site|page|content) (is |has been )?blocked\b/i,
  /\bblocked by (your|the|this|administrator)\b/i,
  /\bweb page blocked\b/i,
  /\byour organization\b/i,
  /\bpolicy violation\b/i,
];

export type EmbedHealth = "ok" | "empty" | "blocked" | "unreadable";

export function classifyEmbedDocument(doc: Document | null | undefined): EmbedHealth {
  if (!doc?.body) return "empty";

  const text = (doc.body.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 8000);
  const html = doc.documentElement?.innerHTML?.slice(0, 12000) ?? "";

  if (text.length > 0) {
    for (const pattern of BLOCK_PATTERNS) {
      if (pattern.test(text) || pattern.test(html.slice(0, 4000))) return "blocked";
    }
  }

  const hasPlaySurface =
    doc.querySelector("canvas, iframe, #unity-canvas, .embed-frame, #game, #unity-container") !==
    null;
  const hasSubstantialDom = doc.body.childElementCount > 0 && (text.length > 12 || html.length > 400);

  if (!hasPlaySurface && !hasSubstantialDom) return "empty";
  if (!hasPlaySurface && text.length < 8 && html.length < 200) return "empty";

  return "ok";
}

export function isLikelyBlockedHtml(html: string): boolean {
  const sample = html.replace(/<!--[\s\S]*?-->/g, " ").slice(0, 8000);
  for (const pattern of BLOCK_PATTERNS) {
    if (pattern.test(sample)) return true;
  }
  return false;
}
