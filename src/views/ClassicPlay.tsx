import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { classicBySlug, classicEmbedSrc, recommendGames, type ClassicGame } from "../classics";
import { GamePickCard } from "../components/GamePickCard";
import { exitDocumentFullscreen, isElementFullscreen, requestElementFullscreen } from "../lib/fullscreen";
import { classicBack, Link } from "../route";

export function ClassicPlay({ slug }: { slug: string }) {
  const game = classicBySlug(slug);
  const src = useMemo(() => (game ? classicEmbedSrc(game) : ""), [game, slug]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const recommendRef = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const related = useMemo(() => (game ? recommendGames(game, 10) : []), [game]);

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

  if (!game || !src) {
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
          <p className="kicker tiny">Embedded on Polygons</p>
          <h1>{game.name}</h1>
        </div>
        <div className="play-chrome">
          <button type="button" className="btn btn-line" onClick={toggleFullscreen}>
            {fullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
          <button type="button" className="btn btn-green" onClick={scrollToRecommend}>
            Recommend games
          </button>
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
        <EmbedFrame game={game} src={src} fillViewport={fullscreen} />
      </div>
      <p className="goal">{game.line}</p>
      <p className="hint in-tab">
        The game runs inside Polygons. Your address bar stays on this site.
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
  fillViewport,
}: {
  game: ClassicGame;
  src: string;
  fillViewport: boolean;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const update = () => {
      const cw = shell.clientWidth;
      const ch = shell.clientHeight;
      if (cw < 1 || ch < 1) return;
      const next = Math.min(cw / game.width, ch / game.height);
      setScale(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(shell);
    return () => observer.disconnect();
  }, [game.width, game.height, fillViewport]);

  const fittedW = game.width * scale;
  const fittedH = game.height * scale;

  return (
    <div className={`embed-shell${fillViewport ? " embed-shell-fill" : ""}`} ref={shellRef}>
      <div className="embed-scale-wrap" style={{ width: fittedW, height: fittedH }}>
        <iframe
          key={src}
          className="embed-frame"
          title={game.name}
          src={src}
          width={game.width}
          height={game.height}
          style={{
            width: game.width,
            height: game.height,
            transform: `scale(${scale})`,
          }}
          allow="autoplay; fullscreen; gamepad"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
        />
      </div>
    </div>
  );
}
