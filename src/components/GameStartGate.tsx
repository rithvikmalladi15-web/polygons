import type { ClassicGame } from "../classics";
import { GameThumb } from "./GameThumb";

type Props = {
  game: ClassicGame;
  onStart: () => void;
  compact?: boolean;
};

/** Cover + button — proxy embed loads only after the user presses Play. */
export function GameStartGate({ game, onStart, compact = false }: Props) {
  return (
    <div className={`embed-start-gate${compact ? " embed-start-gate-compact" : ""}`}>
      <GameThumb game={game} priority className="embed-start-poster" />
      <button type="button" className="btn btn-green" onClick={onStart}>
        Play {game.name}
      </button>
      <p className="hint">
        {compact
          ? "Loads on Polygons when you press Play."
          : "The game loads through Polygons only after you press Play — not while browsing the library."}
      </p>
    </div>
  );
}
