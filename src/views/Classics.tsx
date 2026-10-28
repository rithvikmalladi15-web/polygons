import { useEffect, useMemo, useRef, useState } from "react";
import { classicCount, filterClassics, type ClassicShelf } from "../classics";
import { Footer } from "../components/Footer";
import { GamePickCard } from "../components/GamePickCard";
import { Link, go, openRandomClassic } from "../route";

type ShelfFilter = ClassicShelf | "all";

const PAGE = 48;

const SHELVES: { id: ShelfFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "catalog", label: "Catalog" },
  { id: "spotlight", label: "Spotlight" },
  { id: "famous", label: "Classics" },
  { id: "unblock", label: "UNBLOCK" },
  { id: "coolmath", label: "Cool Math" },
];

export function Classics({ embedded = false }: { embedded?: boolean }) {
  const [q, setQ] = useState("");
  const [shelf, setShelf] = useState<ShelfFilter>("all");
  const [limit, setLimit] = useState(PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => filterClassics(q, shelf), [q, shelf]);
  const total = classicCount("all");
  const visible = hits.slice(0, limit);

  useEffect(() => {
    setLimit(PAGE);
    scrollRef.current?.scrollTo({ top: 0 });
    if (!embedded) window.scrollTo({ top: 0 });
  }, [q, shelf, embedded]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const onScroll = () => {
      if (limit >= hits.length) return;
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 320) {
        setLimit((value) => Math.min(value + PAGE, hits.length));
      }
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [hits.length, limit, embedded]);

  useEffect(() => {
    if (!embedded) return;
    const onWindowScroll = () => {
      if (limit >= hits.length) return;
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 400) {
        setLimit((value) => Math.min(value + PAGE, hits.length));
      }
    };
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, [embedded, hits.length, limit]);

  const head = (
    <div className={embedded ? "wrap lib-head" : "wrap"}>
      <div className="lib-title">
        <p className="kicker">{embedded ? "Library" : "Play"}</p>
        <h1 className={embedded ? "" : "display"}>{embedded ? "Games" : "1,000+ games in one tab."}</h1>
        {!embedded && (
          <p className="lede paper-lede">
            {total.toLocaleString()} games, including classics and UNBLOCK picks. Your tab stays on Polygons.
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
            <button type="button" className="btn btn-green" onClick={openRandomClassic}>
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
        {visible.map((game) => (
          <GamePickCard key={game.slug} game={game} />
        ))}
      </div>
      {limit < hits.length && (
        <div className="lib-more">
          <button type="button" className="btn btn-line" onClick={() => setLimit((n) => Math.min(n + PAGE, hits.length))}>
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
          Games load from licensed embed hosts.{" "}
          <Link href="/library">Open the library</Link>.
        </p>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="lib">
        {head}
        <div className="lib-scroll" ref={scrollRef}>
          <div className="wrap lib-scroll-inner">{grid}</div>
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
