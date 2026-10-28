import { useState } from "react";
import type { ClassicGame } from "../classics";
import { gameThumbUrl } from "../lib/thumb";
import { thumbFallbackStyle } from "../lib/thumbFallback";

type Props = {
  game: ClassicGame;
  className?: string;
  priority?: boolean;
};

export function GameThumb({ game, className = "", priority = false }: Props) {
  const [failed, setFailed] = useState(false);
  const thumb = gameThumbUrl(game);
  const showImage = Boolean(thumb) && !failed;
  const letter = game.name.trim().slice(0, 1).toUpperCase() || "?";
  const rootClass = ["card-thumb", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass} style={thumbFallbackStyle(game.slug)}>
      {showImage ? (
        <img
          src={thumb}
          alt=""
          width={512}
          height={384}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="card-thumb-fallback" aria-hidden="true">{letter}</span>
      )}
    </div>
  );
}
