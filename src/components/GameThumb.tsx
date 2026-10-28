import { useEffect, useMemo, useState } from "react";
import type { ClassicGame } from "../classics";
import { gameThumbCandidates } from "../lib/thumb";
import { thumbFallbackStyle } from "../lib/thumbFallback";

type Props = {
  game: ClassicGame;
  className?: string;
  priority?: boolean;
};

export function GameThumb({ game, className = "", priority = false }: Props) {
  const candidates = useMemo(() => gameThumbCandidates(game), [game]);
  const [index, setIndex] = useState(0);
  const src = candidates[Math.min(index, candidates.length - 1)] ?? candidates[0];

  useEffect(() => {
    setIndex(0);
  }, [candidates]);

  const rootClass = ["card-thumb", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass} style={thumbFallbackStyle(game.slug)}>
      <img
        src={src}
        alt=""
        width={512}
        height={384}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        referrerPolicy="no-referrer"
        className="card-thumb-img"
        onError={() => {
          if (index < candidates.length - 1) setIndex((i) => i + 1);
        }}
      />
    </div>
  );
}
