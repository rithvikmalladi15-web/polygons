import type { ClassicGame, ClassicShelf } from "../classics";
import { GameThumb } from "./GameThumb";
import { openClassic } from "../route";

function shelfLabel(shelf: ClassicShelf): string {
  if (shelf === "unblock") return "UNBLOCK";
  if (shelf === "coolmath") return "Cool Math";
  if (shelf === "famous") return "Classic";
  if (shelf === "catalog") return "Catalog";
  return "Spotlight";
}

type Props = {
  game: ClassicGame;
  as?: "button" | "div";
};

export function GamePickCard({ game, as = "button" }: Props) {
  const body = (
    <>
      <GameThumb game={game} />
      <span className="kicker tiny">{shelfLabel(game.shelf)}</span>
      <h2>{game.name}</h2>
      <p>{game.line}</p>
      <span className="meta">Play on Polygons</span>
    </>
  );

  if (as === "div") {
    return <article className="card hit-card">{body}</article>;
  }

  return (
    <button type="button" className="card hit-card" onClick={() => openClassic(game.slug)}>
      {body}
    </button>
  );
}
