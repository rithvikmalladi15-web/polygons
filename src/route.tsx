import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { randomClassicSlug } from "./classics";

export function useLocationKey(): string {
  const [key, setKey] = useState(() => location.pathname + location.search + location.hash);
  useEffect(() => {
    const sync = () => setKey(location.pathname + location.search + location.hash);
    window.addEventListener("popstate", sync);
    window.addEventListener("polygons-nav", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("polygons-nav", sync);
    };
  }, []);
  return key;
}

function notify() {
  window.dispatchEvent(new Event("polygons-nav"));
}

function internalUrl(to: string): URL | null {
  const url = new URL(to, location.origin);
  if (url.origin !== location.origin) return null;
  return url;
}

export function go(to: string) {
  const url = internalUrl(to);
  if (!url) return;
  history.pushState({}, "", url.pathname + url.search + url.hash);
  notify();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => {
    if (url.hash) {
      document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, 30);
}

export function replace(to: string) {
  const url = internalUrl(to);
  if (!url) return;
  history.replaceState({}, "", url.pathname + url.search + url.hash);
  notify();
}

export function openClassic(slug: string) {
  try {
    sessionStorage.setItem("polygons-from", location.pathname + location.search);
  } catch {
    /* ignore */
  }
  go(`/hit/${slug}`);
}

export function openRandomClassic() {
  openClassic(randomClassicSlug());
}

export function classicBack() {
  let dest = "/library";
  try {
    const from = sessionStorage.getItem("polygons-from");
    if (from && !from.startsWith("/play/")) dest = from;
  } catch {
    /* ignore */
  }
  go(dest);
}

export function Link({
  href,
  className,
  children,
  onClick,
  current,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  current?: boolean;
}) {
  return (
    <a
      href={href}
      className={className}
      aria-current={current ? "page" : undefined}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.();
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        if (!internalUrl(href)) return;
        go(href);
      }}
    >
      {children}
    </a>
  );
}
