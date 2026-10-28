import { useEffect } from "react";
import { classicBySlug } from "./classics";
import { SITE_NAME } from "./brand";
import { Nav } from "./components/Nav";
import { Link, replace, useLocationKey } from "./route";
import { ClassicPlay } from "./views/ClassicPlay";
import { Home } from "./views/Home";
import { Library } from "./views/Library";
import { AdminPlayStats } from "./views/AdminPlayStats";

export function App() {
  const key = useLocationKey();
  const path = location.pathname;

  useEffect(() => {
    if (path.startsWith("/play/") || path === "/classics") replace("/library");
  }, [path]);

  useEffect(() => {
    const notFound = `Not found · ${SITE_NAME}`;
    if (path === "/library") document.title = `Library · ${SITE_NAME}`;
    else if (path === "/") document.title = `${SITE_NAME} — play in one tab`;
    else if (path === "/admin/plays") document.title = `Play stats · ${SITE_NAME}`;
    else if (path.startsWith("/hit/")) {
      const slug = path.slice(5);
      const hit = classicBySlug(slug);
      document.title = hit ? `${hit.name} · ${SITE_NAME}` : notFound;
    } else document.title = notFound;
  }, [key, path]);

  const mode = path === "/library" ? "lib-page" : path === "/" ? "home-page" : "subpage";
  const isHit = path.startsWith("/hit/");
  const hitSlug = isHit ? path.slice(5) : "";

  let view = <Missing kind="route" />;
  if (path === "/") view = <Home />;
  else if (path === "/library") view = <Library />;
  else if (path === "/admin/plays") view = <AdminPlayStats />;
  else if (isHit) {
    view = classicBySlug(hitSlug) ? (
      <ClassicPlay key={hitSlug} slug={hitSlug} />
    ) : (
      <Missing kind="game" />
    );
  }

  return (
    <div className={mode}>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <Nav />
      <main id="content">{view}</main>
    </div>
  );
}

function Missing({ kind }: { kind: "route" | "game" }) {
  const gameMissing = kind === "game";
  return (
    <section className="wrap missing">
      <p className="kicker">{gameMissing ? "Missing" : "Not found"}</p>
      <h1 className="display">
        {gameMissing ? "That game isn’t in the library." : "This page doesn’t exist."}
      </h1>
      <Link href="/library" className="btn btn-green">
        Browse games
      </Link>
    </section>
  );
}
