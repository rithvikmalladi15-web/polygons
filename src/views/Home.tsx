import { useEffect, useMemo, useState } from "react";
import { CLASSICS, SPOTLIGHT, classicCount, curatedHomePicks } from "../classics";
import { GamePickCard } from "../components/GamePickCard";
import { SITE_NAME } from "../brand";
import { Footer } from "../components/Footer";
import { GameThumb } from "../components/GameThumb";
import { go, Link, openRandomClassic } from "../route";

const HERO_GAME = SPOTLIGHT[0];

const QUESTIONS = [
  {
    q: "Do games send me to another website?",
    a: `No. Every title loads in Polygons’ in-site player (same URL bar). Games are served through our /_abc, /_gd, and /_ext routes — not a redirect to another site.`,
  },
  {
    q: "Where do these games come from?",
    a: "100 hand-picked hits: Minecraft Classic, Slope, Geometry Dash, FNAF, UNBLOCK staples, and more — all hosted for in-site play.",
  },
  {
    q: "Do I install anything?",
    a: "No. Pick a game and it plays in this tab. Keyboard, mouse, and touch work in the embed.",
  },
  {
    q: "Will this work on a school Chromebook?",
    a: `It can, but your district decides. Polygons keeps games on one site (not a chain of blocked links). Many schools still block game sites or *.vercel.app — a custom domain you control helps more than any trick. Share /library?q=mario to search and play in the side panel.`,
  },
  {
    q: "Is there a search engine proxy?",
    a: `No — and you shouldn’t need one. Use the library search (or ?q= in the URL). Games load through Polygons’ own routes so you’re not opening random outside tabs.`,
  },
];

export function Home() {
  const [open, setOpen] = useState(0);
  const total = classicCount("all");

  useEffect(() => {
    const id = location.hash.slice(1);
    if (!id) return;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 40);
    return () => window.clearTimeout(timer);
  }, []);

  const recommended = useMemo(() => curatedHomePicks(8), []);

  const ticker = useMemo(() => {
    const names = SPOTLIGHT.map((game) => game.name);
    for (let i = 0; i < 28; i++) {
      names.push(CLASSICS[(i * 41) % CLASSICS.length]?.name ?? "Polygons");
    }
    return names;
  }, []);

  return (
    <>
      <section className="hero ink">
        <div className="wrap hero-grid">
          <div>
            <p className="kicker">100 games · cover art ready</p>
            <h1 className="display">Play here. Stay on {SITE_NAME}.</h1>
            <p className="lede">
              Minecraft, Slope, Geometry Dash, FNAF, Subway Surfers, and 95 more favorites — each one part of our
              saved in-house library, embedded in this tab.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn btn-gold" onClick={openRandomClassic}>
                Play a random game
              </button>
              <Link href="/library" className="btn btn-ghost">
                Browse library
              </Link>
              <button type="button" className="btn btn-line" onClick={() => go("/#recommended")}>
                Recommended
              </button>
            </div>
            <dl className="stats">
              <div>
                <dt>Saved library</dt>
                <dd>{total.toLocaleString()}</dd>
              </div>
              <div>
                <dt>UNBLOCK</dt>
                <dd>{classicCount("unblock")}</dd>
              </div>
              <div>
                <dt>Classics</dt>
                <dd>{classicCount("famous")}</dd>
              </div>
            </dl>
          </div>
          <div className="device">
            <div className="device-top">
              <div>
                <p>Now playing</p>
                <strong>{HERO_GAME?.name ?? "Slope"}</strong>
              </div>
              <span>Embedded</span>
            </div>
            <div className="device-screen embed-preview">
              {HERO_GAME ? (
                <GameThumb game={HERO_GAME} className="device-poster" priority />
              ) : (
                <p className="device-caption">Pick a game — it plays right here.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <Ticker items={ticker} />
        <Ticker items={ticker} reverse />
      </div>

      <section className="section" id="how">
        <div className="wrap">
          <p className="kicker">How it works</p>
          <h2 className="display">Real games, one quiet tab.</h2>
          <div className="how-grid">
            <article className="panel">
              <h3>Embedded, not linked away</h3>
              <p>Each game runs inside {SITE_NAME}. You never bounce to another homepage when you press play.</p>
            </article>
            <article className="panel">
              <h3>100 saved games</h3>
              <p>Search and filters cover our full saved set — no random third-party catalog clutter.</p>
            </article>
            <article className="panel">
              <h3>Fits the frame</h3>
              <p>Every game scales to the player box — portrait, landscape, and fullscreen-friendly.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section tight" id="recommended">
        <div className="wrap">
          <p className="kicker">For you</p>
          <h2 className="display">Recommended for you.</h2>
          <div className="classics-grid recommend-grid">
            {recommended.map((game) => (
              <GamePickCard key={game.slug} game={game} />
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <p className="kicker">Start here</p>
          <h2 className="display">Spotlight picks.</h2>
          <div className="feature-grid">
            {recommended.slice(0, 6).map((game) => (
              <Link key={game.slug} href={`/hit/${game.slug}`} className="card hit-card">
                <GameThumb game={game} />
                <span className="kicker tiny">Saved pick</span>
                <h3>{game.name}</h3>
                <p>{game.line}</p>
                <span className="meta">Play on {SITE_NAME}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap band-inner">
          <div>
            <h2 className="display">Pick one and start.</h2>
            <p>Surprise me opens a random game from the saved library.</p>
          </div>
          <button type="button" className="btn btn-green" onClick={openRandomClassic}>
            Surprise me
          </button>
        </div>
      </section>

      <section className="section" id="questions">
        <div className="wrap faq">
          <p className="kicker">Questions</p>
          <h2 className="display">Plain answers.</h2>
          <div>
            {QUESTIONS.map((item, index) => {
              const expanded = open === index;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    className="acc"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? -1 : index)}
                  >
                    <span>{item.q}</span>
                    <span aria-hidden="true">{expanded ? "–" : "+"}</span>
                  </button>
                  {expanded && <p>{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="close ink">
        <div className="wrap close-inner">
          <h2 className="display">The library is already open.</h2>
          <Link href="/library" className="btn btn-gold">
            Browse {total.toLocaleString()} games
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}

function Ticker({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <div className={`ticker ${reverse ? "reverse" : ""}`}>
      <TickerGroup items={items} />
      <TickerGroup items={items} hidden />
    </div>
  );
}

function TickerGroup({ items, hidden = false }: { items: string[]; hidden?: boolean }) {
  return (
    <div className="ticker-group" aria-hidden={hidden || undefined}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="tick">
          {item}
          <i />
        </span>
      ))}
    </div>
  );
}
