import { useEffect, useMemo, useRef, useState } from "react";
import { classicCount, filterClassics, randomClassicSlug, type ClassicShelf } from "../classics";
import { Footer } from "../components/Footer";
import { GamePickCard } from "../components/GamePickCard";
import { GameDockPlayer, libraryPlayParam, setLibraryPlay } from "../components/GameDockPlayer";
import { libraryPageSize, onScrollThrottled, priorityThumbCount, searchDebounceMs } from "../lib/perf";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import { Link, go, useLocationKey } from "../route";

type ShelfFilter = ClassicShelf | "all";

const SHELVES: { id: ShelfFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "spotlight", label: "Spotlight" },
  { id: "famous", label: "Classics" },
  { id: "unblock", label: "UNBLOCK" },
  { id: "coolmath", label: "Cool Math" },
];

export function Classics({ embedded = false }: { embedded?: boolean }) {
  const navKey = useLocationKey();
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get("q") ?? "");
  const dockSlug = embedded ? libraryPlayParam() : null;
  const [shelf, setShelf] = useState<ShelfFilter>("all");
  const pageSize = libraryPageSize();
  const [limit, setLimit] = useState(pageSize);
  const [headCompact, setHeadCompact] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const qFilter = useDebouncedValue(q, searchDebounceMs());
  const hits = useMemo(() => filterClassics(qFilter, shelf), [qFilter, shelf]);
  const total = classicCount("all");
  const visible = hits.slice(0, limit);

  useEffect(() => {
    setLimit(pageSize);
    setHeadCompact(false);
    scrollRef.current?.scrollTo({ top: 0 });
    if (!embedded) window.scrollTo({ top: 0 });
  }, [qFilter, shelf, embedded, pageSize]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(location.search).get("q") ?? "";
    setQ(fromUrl);
  }, [navKey]);

  useEffect(() => {
    if (!embedded) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(location.search);
      const trimmed = q.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const next = params.toString();
      const want = next ? `/library?${next}` : "/library";
      if (location.pathname + location.search !== want) {
        history.replaceState({}, "", want);
        window.dispatchEvent(new Event("polygons-nav"));
      }
    }, searchDebounceMs());
    return () => window.clearTimeout(timer);
  }, [q, embedded]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    return onScrollThrottled(root, () => {
      setHeadCompact(root.scrollTop > 48);
      if (limit >= hits.length) return;
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 320) {
        setLimit((value) => Math.min(value + pageSize, hits.length));
      }
    });
  }, [hits.length, limit, embedded, pageSize]);

  useEffect(() => {
    if (!embedded) return;
    return onScrollThrottled(window, () => {
      if (limit >= hits.length) return;
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 400) {
        setLimit((value) => Math.min(value + pageSize, hits.length));
      }
    });
  }, [embedded, hits.length, limit, pageSize]);

  const head = (
    <div className={embedded ? "wrap lib-head" : "wrap"}>
      <div className="lib-title">
        <p className="kicker">{embedded ? "Library" : "Play"}</p>
        <h1 className={embedded ? "" : "display"}>{embedded ? "Games" : `${total} games on Polygons.`}</h1>
        {!embedded && (
          <p className="lede paper-lede">
            {total.toLocaleString()} games in one tab — search the library, play in the side panel, all through Polygons.
          </p>
        )}
      </div>
      <div className={embedded ? "lib-tools" : ""}>
        <label className="sr" htmlFor="classic-search">Search games</label>
        <input
          id="classic-search"
          className="search classics-search"
          value={q}
          placeholder="Search flappy, fnaf, slope, subway, 1v1…"
          onChange={(event) => setQ(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {embedded && (
          <>
            <button type="button" className="btn btn-line" onClick={() => go("/#recommended")}>
              Recommended
            </button>
            <button
              type="button"
              className="btn btn-green"
              onClick={() => {
                const slug = randomClassicSlug();
                if (embedded) setLibraryPlay(slug);
                else go(`/hit/${slug}`);
              }}
            >
              Surprise me
            </button>
          </>
        )}
      </div>
      <div className="chips classics-chips" role="group" aria-label="Filter games">
        {SHELVES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="chip"
            aria-pressed={shelf === item.id}
            onClick={() => setShelf(item.id)}
          >
            {item.label}
            {item.id === "all" ? ` (${total})` : ` (${classicCount(item.id)})`}
          </button>
        ))}
      </div>
    </div>
  );

  const grid = (
    <>
      <p className="lib-note classics-count" aria-live="polite">
        Showing {visible.length.toLocaleString()} of {hits.length.toLocaleString()}{" "}
        {hits.length === 1 ? "game" : "games"}
      </p>
      <div className="classics-grid">
        {visible.map((game, index) => (
          <GamePickCard
            key={game.slug}
            game={game}
            priorityThumb={index < priorityThumbCount()}
            playTarget={embedded ? "dock" : "page"}
          />
        ))}
      </div>
      {limit < hits.length && (
        <div className="lib-more">
          <button type="button" className="btn btn-line" onClick={() => setLimit((n) => Math.min(n + pageSize, hits.length))}>
            Load more
          </button>
        </div>
      )}
      {hits.length === 0 && (
        <div className="empty">
          <h2>Nothing by that name.</h2>
          <p>Try flappy bird, fnaf, slope, subway, or 1v1.</p>
        </div>
      )}
      {!embedded && (
        <p className="classics-foot">
          Every game runs in Polygons’ in-site player.{" "}
          <Link href="/library">Open the library</Link> to search and play in the side panel.
        </p>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className={`lib${dockSlug ? " lib-split-open" : ""}${headCompact ? " lib-compact" : ""}`}>
        {head}
        <div className="lib-split-body">
          <div className="lib-scroll" ref={scrollRef}>
            <div className="wrap lib-scroll-inner">{grid}</div>
          </div>
          {dockSlug ? (
            <GameDockPlayer slug={dockSlug} onClose={() => setLibraryPlay(null)} />
          ) : (
            <aside className="lib-dock lib-dock-empty" aria-label="Game player">
              <p className="kicker tiny">Side player</p>
              <p className="hint">Choose a game, then press Play in the panel — the proxy loads only when you start.</p>
            </aside>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="section classics-head">{head}</section>
      <section className="section tight">
        <div className="wrap">{grid}</div>
      </section>
      <Footer />
    </>
  );
}
