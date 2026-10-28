export type ClassicShelf = "spotlight" | "famous" | "unblock" | "coolmath" | "catalog";

export type ClassicGame = {
  slug: string;
  name: string;
  line: string;
  tags: string[];
  width: number;
  height: number;
  shelf: ClassicShelf;
  gdId?: string;
  directUrl?: string;
  abcPath?: string;
  thumbUrl?: string;
};
