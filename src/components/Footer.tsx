import { SITE_NAME } from "../brand";
import { Link } from "../route";
import { LogoMark, LogoWordmark } from "./Logo";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-brand">
          <div className="brand footer-mark">
            <LogoMark />
            <LogoWordmark />
          </div>
          <p>1,000+ games embedded and played on {SITE_NAME}.</p>
        </div>
        <div className="footer-links">
          <Link href="/library">Library</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/#questions">Questions</Link>
        </div>
      </div>
    </footer>
  );
}
