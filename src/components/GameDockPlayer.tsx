import { useCallback, useEffect, useMemo, useState } from "react";
import { classicBySlug, classicEmbedCandidates } from "../classics";
import { GameEmbedFrame } from "./GameEmbedFrame";
import { GameStartGate } from "./GameStartGate";
import { Link, go } from "../route";

type Props = {
  slug: string;
  onClose: () => void;
};

export function GameDockPlayer({ slug, onClose }: Props) {
  const game = classicBySlug(slug);
  const candidates = useMemo(() => (game ? classicEmbedCandidates(game) : []), [game]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [started, setStarted] = useState(false);
  const src = candidates[sourceIndex] ?? "";

  useEffect(() => {
    setSourceIndex(0);
    setStuck(false);
    setStarted(false);
  }, [slug]);

  const tryNextSource = useCallback(() => {
    setStuck(false);
    setSourceIndex((index) => {
      if (index < candidates.length - 1) return index + 1;
      return index;
    });
  }, [candidates.length]);

  if (!game || !src) {
    return (
      <aside className="lib-dock" aria-label="Game player">
        <p className="hint">Pick a game from the list.</p>
      </aside>
    );
  }

  const ratio = game.width / game.height;

  return (
    <aside className="lib-dock" aria-label={`Playing ${game.name}`}>
      <div className="lib-dock-head">
        <div>
          <p className="kicker tiny">{started ? "In-site player" : "Ready to play"}</p>
          <h2 className="lib-dock-title">{game.name}</h2>
        </div>
        <div className="lib-dock-actions">
          {started && candidates.length > 1 && (
            <button type="button" className="btn btn-line btn-sm" onClick={tryNextSource}>
              Switch source
            </button>
          )}
          <Link href={`/hit/${game.slug}`} className="btn btn-green btn-sm">
            Full page
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="lib-dock-frame" style={{ ["--embed-ratio" as string]: String(ratio) }}>
        {!started ? (
          <GameStartGate game={game} onStart={() => setStarted(true)} compact />
        ) : (
          <GameEmbedFrame
            game={game}
            src={src}
            sourceIndex={sourceIndex}
            sourceCount={candidates.length}
            stuck={stuck}
            onStuck={() => setStuck(true)}
            onLoadError={tryNextSource}
          />
        )}
      </div>
      {started && stuck && (
        <p className="hint lib-dock-hint">
          White or black screen?{" "}
          <button type="button" className="text-btn" onClick={tryNextSource}>
            Try another source
          </button>{" "}
          or{" "}
          <Link href={`/hit/${game.slug}`} className="text-btn">
            open full page
          </Link>
          .
        </p>
      )}
      <p className="hint lib-dock-hint">
        {started
          ? `Loaded on Polygons. Source ${sourceIndex + 1}/${candidates.length}. Click inside the frame to play.`
          : "Pick Play to load this game — the proxy does not run until you do."}
      </p>
    </aside>
  );
}

export function libraryPlayParam(): string | null {
  const params = new URLSearchParams(location.search);
  return params.get("play") || params.get("game");
}

export function setLibraryPlay(slug: string | null) {
  const params = new URLSearchParams(location.search);
  if (slug) {
    params.set("play", slug);
    params.delete("game");
  } else {
    params.delete("play");
    params.delete("game");
  }
  const q = params.toString();
  go(q ? `/library?${q}` : "/library");
}
