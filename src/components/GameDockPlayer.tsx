import { useEffect, useMemo, useState } from "react";
import { classicBySlug, classicEmbedCandidates } from "../classics";
import { Link, go } from "../route";

type Props = {
  slug: string;
  onClose: () => void;
};

export function GameDockPlayer({ slug, onClose }: Props) {
  const game = classicBySlug(slug);
  const candidates = useMemo(() => (game ? classicEmbedCandidates(game) : []), [game]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = candidates[sourceIndex] ?? "";

  useEffect(() => {
    setSourceIndex(0);
  }, [slug]);

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
          <p className="kicker tiny">In-site player</p>
          <h2 className="lib-dock-title">{game.name}</h2>
        </div>
        <div className="lib-dock-actions">
          {candidates.length > 1 && (
            <button
              type="button"
              className="btn btn-line btn-sm"
              onClick={() => setSourceIndex((i) => Math.min(i + 1, candidates.length - 1))}
            >
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
        <iframe
          key={src}
          className="embed-frame"
          title={game.name}
          src={src}
          allow="autoplay; fullscreen; gamepad; microphone; camera"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock allow-downloads"
          onError={() => {
            if (sourceIndex < candidates.length - 1) setSourceIndex((i) => i + 1);
          }}
        />
      </div>
      <p className="hint lib-dock-hint">
        Same-site player (/_abc, /_gd, /_ext). Source {sourceIndex + 1}/{candidates.length}.
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
