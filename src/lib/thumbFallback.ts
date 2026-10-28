import type { CSSProperties } from "react";

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function thumbFallbackStyle(slug: string): CSSProperties {
  const hash = hashSlug(slug);
  const h = hash % 360;
  const h2 = (h + 38) % 360;
  const s = 42 + (hash % 18);
  return {
    background: `linear-gradient(145deg, hsl(${h} ${s}% 24%) 0%, hsl(${h2} ${s + 8}% 11%) 55%, #070b14 100%)`,
  };
}

/** Inline SVG poster when CDN thumbs fail (always loads, good for ads). */
export function posterDataUrl(name: string, slug: string): string {
  const hash = hashSlug(slug);
  const h = hash % 360;
  const safe = name.replace(/[<>&"']/g, "").slice(0, 48);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384" viewBox="0 0 512 384">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${h} 48% 28%)"/>
      <stop offset="100%" style="stop-color:#070b14"/>
    </linearGradient>
  </defs>
  <rect width="512" height="384" fill="url(#g)"/>
  <text x="256" y="200" text-anchor="middle" fill="#e8f0ff" font-family="system-ui,sans-serif" font-size="28" font-weight="700">${safe}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
