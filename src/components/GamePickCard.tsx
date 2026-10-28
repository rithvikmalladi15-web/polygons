import type { ClassicGame, ClassicShelf } from "../classics";
import { GameThumb } from "./GameThumb";
import { Link, rememberClassicReturn } from "../route";

function shelfLabel(shelf: ClassicShelf): string {
  if (shelf === "unblock") return "UNBLOCK";
  if (shelf === "coolmath") return "Cool Math";
  if (shelf === "famous") return "Classic";
  if (shelf === "catalog") return "Catalog";
  return "Spotlight";
}

type Props = {
  game: ClassicGame;
  as?: "link" | "div";
  priorityThumb?: boolean;
};

export function GamePickCard({ game, as = "link", priorityThumb = false }: Props) {
  const body = (
    <>
      <GameThumb game={game} priority={priorityThumb} />
      <span className="kicker tiny">{shelfLabel(game.shelf)}</span>
      <h2>{game.name}</h2>
      <p className="game-card-intro">{game.line}</p>
      <span className="meta">Play now →</span>
    </>
  );

  if (as === "div") {
    return <article className="card hit-card game-pick-card">{body}</article>;
  }

  return (
    <Link
      href={`/hit/${game.slug}`}
      className="card hit-card game-pick-card"
      onClick={rememberClassicReturn}
    >
      {body}
    </Link>
  );
}
