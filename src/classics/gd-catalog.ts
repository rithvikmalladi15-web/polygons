import type { ClassicGame } from "./types";
import raw from "../data/gd-catalog.json";

type RawEntry = {
  slug: string;
  name: string;
  gdId: string;
  width: number;
  height: number;
  tags?: string[];
};

const entries = (raw as { games: RawEntry[] }).games ?? [];

export const GD_CATALOG: ClassicGame[] = entries.map((entry) => ({
  slug: entry.slug,
  name: entry.name,
  line: `Play ${entry.name} in your browser — embedded on Polygons.`,
  tags: [...(entry.tags ?? []), "catalog", "html5", "gamedistribution"],
  width: entry.width,
  height: entry.height,
  shelf: "catalog",
  gdId: entry.gdId,
  gdPublishSlug: entry.slug.startsWith("gd-") ? entry.slug.slice(3) : undefined,
  thumbUrl: `https://img.gamedistribution.com/${entry.gdId}-512x384.jpg`,
}));
