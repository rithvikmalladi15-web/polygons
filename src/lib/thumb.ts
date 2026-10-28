import covers from "../data/covers.json";
import type { ClassicGame } from "../classics/types";

const COVERS = covers as Record<string, string>;

function gdThumbId(gdId: string): string | undefined {
  const trimmed = gdId.replace(/\/$/, "");
  if (/^[a-f0-9]{32}$/i.test(trimmed)) return trimmed;
  const segment = trimmed.split("/").find((part) => /^[a-f0-9]{32}$/i.test(part));
  return segment;
}

export function gameThumbUrl(game: ClassicGame): string | undefined {
  const cover = COVERS[game.slug];
  if (cover) return cover;
  if (game.thumbUrl) return game.thumbUrl;
  if (game.gdId) {
    const id = gdThumbId(game.gdId);
    if (id) return `https://img.gamedistribution.com/${id}-512x384.jpg`;
  }
  return undefined;
}
