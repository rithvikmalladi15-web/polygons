export type PerfMode = "full" | "lite";

let mode: PerfMode = "full";

/** Chromebooks and other low-RAM / low-core devices get lighter UI defaults. */
export function detectLiteDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  if (/CrOS/i.test(ua)) return true;

  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === "number" && mem <= 4) return true;

  const cores = navigator.hardwareConcurrency;
  const coarse =
    typeof matchMedia === "function" ? matchMedia("(pointer: coarse)").matches : false;
  if (typeof cores === "number" && cores <= 4 && coarse) return true;

  const narrow = typeof matchMedia === "function" ? matchMedia("(max-width: 900px)").matches : false;
  if (/CrOS/i.test(ua) && narrow) return true;

  return false;
}

export function initPerfMode(): PerfMode {
  const fromDom = document.documentElement.dataset.perf;
  if (fromDom === "lite" || fromDom === "full") {
    mode = fromDom;
  } else {
    mode = detectLiteDevice() ? "lite" : "full";
    document.documentElement.dataset.perf = mode;
  }
  if (mode === "lite") {
    document.documentElement.classList.add("perf-lite");
    document.getElementById("gf-fonts")?.remove();
  }
  return mode;
}

export function perfMode(): PerfMode {
  return mode;
}

export function libraryPageSize(): number {
  return mode === "lite" ? 12 : 24;
}

export function priorityThumbCount(): number {
  return mode === "lite" ? 4 : 8;
}

export function searchDebounceMs(): number {
  return mode === "lite" ? 420 : 280;
}

export function recommendCount(): number {
  return mode === "lite" ? 6 : 10;
}

/** Coalesce high-frequency scroll handlers (library grid, nav). */
export function onScrollThrottled(target: Window | HTMLElement, handler: () => void): () => void {
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      handler();
    });
  };
  target.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    if (raf) cancelAnimationFrame(raf);
    target.removeEventListener("scroll", onScroll);
  };
}
