import { useEffect, useState } from "react";
import { Link, openRandomClassic, useLocationKey } from "../route";
import { LogoMark, LogoWordmark } from "./Logo";

export function Nav() {
  const loc = useLocationKey();
  const home = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [loc]);

  const tone = home && !scrolled && !open ? "ink" : "paper";

  return (
    <header className={`nav ${tone}`}>
      <div className="wrap nav-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <LogoMark />
          <LogoWordmark />
        </Link>
        <nav className="nav-links" aria-label="Sections">
          <Link href="/library" className="nav-link" current={location.pathname === "/library"}>
            Library
          </Link>
          <Link href="/#how" className="nav-link">
            How it works
          </Link>
          <Link href="/#questions" className="nav-link">
            Questions
          </Link>
        </nav>
        <button type="button" className="btn btn-gold nav-cta" onClick={openRandomClassic}>
          Play
        </button>
        <button
          type="button"
          className="menu"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </div>
      {open && (
        <div className="menu-panel">
          <Link href="/library" onClick={() => setOpen(false)}>
            Library
          </Link>
          <Link href="/#how" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link href="/#questions" onClick={() => setOpen(false)}>
            Questions
          </Link>
        </div>
      )}
    </header>
  );
}
