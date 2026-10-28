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
  /** GameDistribution.com `/games/<slug>/` page used as gd_sdk_referrer_url when set. */
  gdPublishSlug?: string;
  directUrl?: string;
  abcPath?: string;
  thumbUrl?: string;
};
