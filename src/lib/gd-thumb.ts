/** GameDistribution CDN thumbnails (512x384 JPG is often 403; JPEG 512 works). */
export function gdThumbId(gdId: string): string | undefined {
  const trimmed = gdId.replace(/\/$/, "");
  if (/^[a-f0-9]{32}$/i.test(trimmed)) return trimmed.toLowerCase();
  const segment = trimmed.split("/").find((part) => /^[a-f0-9]{32}$/i.test(part));
  return segment?.toLowerCase();
}

export function gdThumbUrls(gdId: string): string[] {
  const id = gdThumbId(gdId);
  if (!id) return [];
  return [
    `https://img.gamedistribution.com/${id}-512x384.jpeg`,
    `https://img.gamedistribution.com/${id}-512x512.jpeg`,
    `https://img.gamedistribution.com/${id}-512x384.jpg`,
  ];
}
