export function isElementFullscreen(el: Element | null): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  const active = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  return Boolean(el && active === el);
}

export async function requestElementFullscreen(el: HTMLElement): Promise<void> {
  const node = el as HTMLElement & {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => void;
  };
  if (node.requestFullscreen) await node.requestFullscreen();
  else if (node.webkitRequestFullscreen) node.webkitRequestFullscreen();
}

export async function exitDocumentFullscreen(): Promise<void> {
  const doc = document as Document & { webkitExitFullscreen?: () => void };
  if (doc.fullscreenElement && doc.exitFullscreen) await doc.exitFullscreen();
  else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
}
