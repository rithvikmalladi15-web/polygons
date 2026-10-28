import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { classicBySlug, classicEmbedCandidates, classicExternalPlayUrl, classicSameOriginPlayerUrl, recommendGames, type ClassicGame } from "../classics";
import { GamePickCard } from "../components/GamePickCard";
import { exitDocumentFullscreen, isElementFullscreen, requestElementFullscreen } from "../lib/fullscreen";
import { recordGamePlay } from "../lib/play-stats";
import { classicBack, Link } from "../route";

export function ClassicPlay({ slug }: { slug: string }) {
  const game = classicBySlug(slug);
  const candidates = useMemo(() => (game ? classicEmbedCandidates(game) : []), [game]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = candidates[sourceIndex] ?? "";
  const fallbackExternal = game ? classicExternalPlayUrl(game) : "";
  const sameOriginPlayer = game ? classicSameOriginPlayerUrl(game) : "";
  const viewportRef = useRef<HTMLDivElement>(null);
  const recommendRef = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [stuck, setStuck] = useState(false);

  const related = useMemo(() => (game ? recommendGames(game, 10) : []), [game]);

  useEffect(() => {
    setSourceIndex(0);
    setEmbedFailed(false);
    setStuck(false);
  }, [game?.slug]);

  useEffect(() => {
    if (!game?.slug) return;
    recordGamePlay(game.slug);
  }, [game?.slug]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const sync = () => setFullscreen(isElementFullscreen(viewport));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const scrollToRecommend = () => {
    recommendRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFullscreen = async () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (isElementFullscreen(viewport)) await exitDocumentFullscreen();
    else await requestElementFullscreen(viewport);
  };

  const tryNextSource = useCallback(() => {
    setStuck(false);
    setSourceIndex((index) => {
      if (index < candidates.length - 1) {
        setEmbedFailed(false);
        return index + 1;
      }
      setEmbedFailed(true);
      return index;
    });
  }, [candidates.length]);

  const restartSources = useCallback(() => {
    setEmbedFailed(false);
    setStuck(false);
    setSourceIndex(0);
  }, []);

  const markStuck = useCallback(() => setStuck(true), []);

  if (!game || candidates.length === 0) {
    return (
      <section className="wrap missing">
        <p className="kicker">Missing</p>
        <h1 className="display">That game isn’t in the library.</h1>
        <Link href="/library" className="btn btn-green">
          Browse games
        </Link>
      </section>
    );
  }

  const ratio = game.width / game.height;
  const embedVars = { "--embed-ratio": String(ratio) } as CSSProperties;

  return (
    <div className="wrap play classic-play">
      <div className="play-top">
        <div>
          <button type="button" className="text-btn" onClick={classicBack}>
            Back
          </button>
          <p className="kicker tiny">Plays on Polygons — in-site player</p>
          <h1>{game.name}</h1>
        </div>
        <div className="play-chrome">
          <button type="button" className="btn btn-line" onClick={toggleFullscreen}>
            {fullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
          <button type="button" className="btn btn-line" onClick={scrollToRecommend}>
            More like this
          </button>
          {candidates.length > 1 && (
            <button type="button" className="btn btn-line" onClick={tryNextSource}>
              Switch source
            </button>
          )}
          {sameOriginPlayer && (
            <a className="btn btn-line" href={sameOriginPlayer} target="_blank" rel="noopener noreferrer">
              Player in new tab
            </a>
          )}
          {fallbackExternal && (
            <a className="btn btn-ghost" href={fallbackExternal} target="_blank" rel="noopener noreferrer">
              Original host
            </a>
          )}
          <Link href="/library" className="btn btn-ghost">
            More games
          </Link>
        </div>
      </div>
      <div
        ref={viewportRef}
        className={`embed-viewport${fullscreen ? " embed-viewport-fs" : ""}`}
        style={embedVars}
      >
        {embedFailed ? (
          <div className="embed-fallback">
            <p>We couldn’t load this game in the player.</p>
            <button type="button" className="btn btn-green" onClick={restartSources}>
              Try again
            </button>
            <a className="btn btn-line" href={sameOriginPlayer || fallbackExternal} target="_blank" rel="noopener noreferrer">
              Open player
            </a>
          </div>
        ) : (
          <EmbedFrame
            game={game}
            src={src}
            sourceIndex={sourceIndex}
            sourceCount={candidates.length}
            fillViewport={fullscreen}
            stuck={stuck}
            onStuck={markStuck}
            onLoadError={tryNextSource}
          />
        )}
      </div>
      {stuck && !embedFailed && (
        <div className="play-stuck-banner">
          <p>Still blank? The host may be blocking the embed.</p>
          <button type="button" className="btn btn-line" onClick={tryNextSource}>
            Try another source
          </button>
          <a className="btn btn-line" href={sameOriginPlayer || fallbackExternal} target="_blank" rel="noopener noreferrer">
            Open player
          </a>
        </div>
      )}
      <p className="goal">{game.line}</p>
      <p className="hint in-tab">
        Games load through Polygons (<code>/_abc</code>, <code>/_gd</code>, <code>/_ext</code>) so you stay on this site.
        Source {sourceIndex + 1} of {candidates.length}. Use <strong>Switch source</strong> if the frame stays blank.
      </p>

      <section className="recommend-block" id="game-recommend" ref={recommendRef}>
        <p className="kicker">More like this</p>
        <h2 className="display recommend-title">Recommended games</h2>
        <div className="classics-grid recommend-grid">
          {related.map((pick) => (
            <GamePickCard key={pick.slug} game={pick} />
          ))}
        </div>
      </section>
    </div>
  );
}

function EmbedFrame({
  game,
  src,
  sourceIndex,
  sourceCount,
  fillViewport,
  stuck,
  onStuck,
  onLoadError,
}: {
  game: ClassicGame;
  src: string;
  sourceIndex: number;
  sourceCount: number;
  fillViewport: boolean;
  stuck: boolean;
  onStuck: () => void;
  onLoadError?: () => void;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const hint = window.setTimeout(() => onStuck(), 8_000);
    return () => window.clearTimeout(hint);
  }, [src, onStuck]);

  return (
    <div className={`embed-shell${fillViewport ? " embed-shell-fill" : ""}`}>
      {loading && (
        <div className="embed-loading" aria-live="polite">
          <p>Loading {game.name}…</p>
          {sourceCount > 1 && (
            <p className="hint">
              Source {sourceIndex + 1} of {sourceCount}
            </p>
          )}
        </div>
      )}
      <iframe
        key={src}
        className="embed-frame"
        title={game.name}
        src={src}
        allow="autoplay; fullscreen; gamepad; microphone; camera"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock allow-downloads"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          onLoadError?.();
        }}
      />
      {stuck && !loading && (
        <div className="embed-stuck-hint">
          <p>Not loading?</p>
        </div>
      )}
    </div>
  );
}
