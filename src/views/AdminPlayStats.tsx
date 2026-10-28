import { useCallback, useMemo, useState } from "react";
import {
  CLASSICS,
  TEEN_TOP_100,
  classicBySlug,
  classicCount,
} from "../classics";
import { Link } from "../route";
import {
  fetchPlayStats,
  getStoredAdminToken,
  setStoredAdminToken,
  type PlayStatsResponse,
} from "../lib/play-stats";

type SortMode = "most" | "least";

export function AdminPlayStats() {
  const [token, setToken] = useState(getStoredAdminToken);
  const [draftToken, setDraftToken] = useState(token);
  const [stats, setStats] = useState<PlayStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortMode>("most");
  const [filter, setFilter] = useState("");

  const load = useCallback(async (adminToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlayStats(adminToken);
      setStats(data);
      setStoredAdminToken(adminToken);
      setToken(adminToken);
    } catch (e) {
      setStats(null);
      setError(e instanceof Error ? e.message : "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const countBySlug = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stats?.rows ?? []) map.set(row.slug, row.count);
    return map;
  }, [stats]);

  const enriched = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const rows = (stats?.rows ?? []).map((row) => {
      const game = classicBySlug(row.slug);
      return {
        slug: row.slug,
        count: row.count,
        name: game?.name ?? row.slug,
        shelf: game?.shelf ?? "—",
      };
    });

    let list = rows;
    if (q) {
      list = list.filter(
        (row) =>
          row.slug.includes(q) ||
          row.name.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => (sort === "most" ? b.count - a.count : a.count - b.count));
    return list;
  }, [stats, filter, sort]);

  const neverPlayedTeen = useMemo(() => {
    return TEEN_TOP_100.filter((row) => !countBySlug.has(row.slug) || (countBySlug.get(row.slug) ?? 0) === 0);
  }, [countBySlug]);

  const neverPlayedAny = useMemo(() => {
    if (!stats) return [];
    const played = new Set(stats.rows.map((r) => r.slug));
    return CLASSICS.filter((g) => !played.has(g.slug)).slice(0, 50);
  }, [stats]);

  const maxCount = stats?.rows[0]?.count ?? 1;

  const exportCsv = () => {
    if (!stats) return;
    const lines = ["slug,name,plays,shelf"];
    for (const row of stats.rows) {
      const game = classicBySlug(row.slug);
      const name = (game?.name ?? row.slug).replace(/"/g, '""');
      lines.push(`"${row.slug}","${name}",${row.count},"${game?.shelf ?? ""}"`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `polygons-plays-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="wrap admin-stats">
      <p className="kicker">Owner</p>
      <h1 className="display">Play tracker</h1>
      <p className="goal">
        See which games get opened most and least. Use this to trim dead weight and double down on hits.
        Not linked in the nav — bookmark <code>/admin/plays</code>.
      </p>

      <form
        className="admin-stats-login"
        onSubmit={(e) => {
          e.preventDefault();
          void load(draftToken.trim());
        }}
      >
        <label className="admin-stats-label">
          Admin token
          <input
            type="password"
            className="lib-search admin-stats-input"
            value={draftToken}
            onChange={(e) => setDraftToken(e.target.value)}
            placeholder="PLAY_STATS_ADMIN_TOKEN from Vercel env"
            autoComplete="off"
          />
        </label>
        <button type="submit" className="btn btn-green" disabled={loading || !draftToken.trim()}>
          {loading ? "Loading…" : "Load stats"}
        </button>
        {token ? (
          <button
            type="button"
            className="btn btn-line"
            onClick={() => {
              setStoredAdminToken("");
              setToken("");
              setDraftToken("");
              setStats(null);
            }}
          >
            Sign out
          </button>
        ) : null}
      </form>

      {error ? (
        <p className="admin-stats-error" role="alert">
          {error === "unauthorized"
            ? "Wrong admin token."
            : error === "storage_not_configured"
              ? "Redis storage isn’t connected yet. Add Upstash Redis from Vercel Storage and redeploy (see setup below)."
              : `Could not load stats (${error}).`}
        </p>
      ) : null}

      {stats ? (
        <>
          <div className="admin-stats-summary">
            <div className="admin-stats-card">
              <span className="admin-stats-num">{stats.totalPlays.toLocaleString()}</span>
              <span className="admin-stats-label-sm">Total plays</span>
            </div>
            <div className="admin-stats-card">
              <span className="admin-stats-num">{stats.uniqueSlugs.toLocaleString()}</span>
              <span className="admin-stats-label-sm">Games with ≥1 play</span>
            </div>
            <div className="admin-stats-card">
              <span className="admin-stats-num">{classicCount().toLocaleString()}</span>
              <span className="admin-stats-label-sm">Games in catalog</span>
            </div>
            <div className="admin-stats-card">
              <span className="admin-stats-num">
                {stats.updatedAt ? new Date(stats.updatedAt).toLocaleString() : "—"}
              </span>
              <span className="admin-stats-label-sm">Last play recorded</span>
            </div>
          </div>

          <div className="admin-stats-toolbar">
            <input
              type="search"
              className="lib-search"
              placeholder="Filter by name or slug…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button
              type="button"
              className={`btn btn-line${sort === "most" ? " admin-stats-active" : ""}`}
              onClick={() => setSort("most")}
            >
              Most played
            </button>
            <button
              type="button"
              className={`btn btn-line${sort === "least" ? " admin-stats-active" : ""}`}
              onClick={() => setSort("least")}
            >
              Least played
            </button>
            <button type="button" className="btn btn-green" onClick={exportCsv}>
              Export CSV
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void load(token)}>
              Refresh
            </button>
          </div>

          <div className="admin-stats-table-wrap">
            <table className="admin-stats-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Game</th>
                  <th>Slug</th>
                  <th>Plays</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {enriched.slice(0, 200).map((row, index) => (
                  <tr key={row.slug}>
                    <td>{index + 1}</td>
                    <td>
                      <Link href={`/hit/${row.slug}`} className="admin-stats-link">
                        {row.name}
                      </Link>
                      <span className="admin-stats-shelf">{row.shelf}</span>
                    </td>
                    <td><code>{row.slug}</code></td>
                    <td>{row.count.toLocaleString()}</td>
                    <td>
                      <span
                        className="admin-stats-bar"
                        style={{ width: `${Math.max(4, (row.count / maxCount) * 100)}%` }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {enriched.length > 200 ? (
              <p className="hint">Showing first 200 rows — use filter or export CSV for the full list.</p>
            ) : null}
          </div>

          <div className="admin-stats-cols">
            <div>
              <h2 className="recommend-title">Teen top 100 — never played</h2>
              <p className="hint">Good candidates to swap out if they stay at zero.</p>
              <ul className="admin-stats-list">
                {neverPlayedTeen.length === 0 ? (
                  <li>Every teen top-100 title has at least one play.</li>
                ) : (
                  neverPlayedTeen.map((row) => (
                    <li key={row.slug}>
                      <Link href={`/hit/${row.slug}`}>{row.name}</Link>
                      <code>{row.slug}</code>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h2 className="recommend-title">Catalog — no plays yet (sample)</h2>
              <p className="hint">First 50 unplayed slugs from the full library.</p>
              <ul className="admin-stats-list">
                {neverPlayedAny.map((game) => (
                  <li key={game.slug}>
                    {game.name}
                    <code>{game.slug}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}

      <details className="admin-stats-setup">
        <summary>Vercel setup (one time)</summary>
        <p className="hint">
          If Vercel says <strong>Invalid name</strong>, you are usually naming the Redis database wrong — not the
          env var value. Use a short lowercase name like <code>polygons-plays</code> (letters, numbers, hyphens only;
          no spaces).
        </p>
        <ol>
          <li>
            Vercel → <strong>Storage</strong> → <strong>Upstash Redis</strong> → Create database. Name:{" "}
            <code>polygons-plays</code> → connect to this project.
          </li>
          <li>
            Settings → Environment Variables → <strong>Key</strong> (name) must be exactly{" "}
            <code>PLAY_STATS_ADMIN_TOKEN</code> — copy/paste, no spaces. <strong>Value</strong> is your secret password
            (e.g. a long random string), not the word “token”.
          </li>
          <li>
            Do <em>not</em> rename <code>KV_REST_API_URL</code> / <code>KV_REST_API_TOKEN</code>; Upstash adds those
            automatically when you connect Redis.
          </li>
          <li>Redeploy, then open this page and paste the same secret into Admin token.</li>
        </ol>
      </details>
    </section>
  );
}
