import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ClassicGame } from "../classics";
import { classifyEmbedDocument } from "../lib/embed-health";

type Props = {
  game: ClassicGame;
  src: string;
  sourceIndex: number;
  sourceCount: number;
  fillViewport?: boolean;
  stuck?: boolean;
  onStuck?: () => void;
  onLoadError?: () => void;
  onBlocked?: () => void;
  ratioStyle?: CSSProperties;
};

/** Proxied game iframe with blank/block detection and source fallback hooks. */
export function GameEmbedFrame({
  game,
  src,
  sourceIndex,
  sourceCount,
  fillViewport = false,
  stuck = false,
  onStuck,
  onLoadError,
  onBlocked,
  ratioStyle,
}: Props) {
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const healthCheckedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    healthCheckedRef.current = false;
    setLoading(true);
    const hint = window.setTimeout(() => onStuck?.(), 8_000);
    const reveal = window.setTimeout(() => setLoading(false), 4_000);
    const failover =
      sourceCount > 1 && sourceIndex < sourceCount - 1
        ? window.setTimeout(() => {
            if (!loadedRef.current) onLoadError?.();
          }, 14_000)
        : undefined;
    return () => {
      window.clearTimeout(hint);
      window.clearTimeout(reveal);
      if (failover !== undefined) window.clearTimeout(failover);
    };
  }, [src, onStuck, onLoadError, sourceCount, sourceIndex]);

  const runHealthCheck = () => {
    if (healthCheckedRef.current) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const health = classifyEmbedDocument(iframe.contentDocument);
      healthCheckedRef.current = true;
      if (health === "blocked") {
        onBlocked?.();
        onLoadError?.();
        return;
      }
      if (health === "empty") {
        onLoadError?.();
      }
    } catch {
      /* cross-origin game document — rely on load + stuck timer */
    }
  };

  const finishLoad = () => {
    loadedRef.current = true;
    setLoading(false);
    window.setTimeout(runHealthCheck, 1500);
    window.setTimeout(runHealthCheck, 5000);
  };

  return (
    <div
      className={`embed-shell${fillViewport ? " embed-shell-fill" : ""}`}
      style={ratioStyle}
    >
      <div
        className={`embed-loading${loading ? "" : " embed-loading-hidden"}`}
        aria-live="polite"
        aria-hidden={!loading}
      >
        <p>Loading {game.name}…</p>
        {sourceCount > 1 && (
          <p className="hint">
            Source {sourceIndex + 1} of {sourceCount}
          </p>
        )}
      </div>
      <iframe
        ref={iframeRef}
        key={src}
        className="embed-frame"
        title={game.name}
        src={src}
        allow="autoplay; fullscreen; gamepad; microphone; camera"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-pointer-lock allow-downloads"
        onLoad={finishLoad}
        onError={() => {
          finishLoad();
          onLoadError?.();
        }}
      />
      {stuck && !loading && (
        <div className="embed-stuck-hint">
          <p>Still blank? Try Switch source — some school networks block game CDNs.</p>
        </div>
      )}
    </div>
  );
}
