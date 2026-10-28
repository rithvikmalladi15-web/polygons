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
