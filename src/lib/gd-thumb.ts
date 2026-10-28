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
    `/_gd/img/${id}-512x384.jpeg`,
    `/_gd/img/${id}-512x512.jpeg`,
    `/_gd/img/${id}-512x384.jpg`,
  ];
}
