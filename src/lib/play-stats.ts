const SESSION_PREFIX = "polygons-play-logged:";

/** Count one play per browser session per game (refresh won’t inflate stats). */
export function recordGamePlay(slug: string): void {
  const safe = slug.trim();
  if (!safe) return;

  try {
    if (sessionStorage.getItem(SESSION_PREFIX + safe)) return;
    sessionStorage.setItem(SESSION_PREFIX + safe, "1");
  } catch {
    /* private mode */
  }

  void fetch("/api/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: safe }),
    keepalive: true,
  }).catch(() => {
    /* offline or KV not configured */
  });
}

const ADMIN_TOKEN_KEY = "polygons-admin-token";

export function getStoredAdminToken(): string {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredAdminToken(token: string): void {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export type PlayStatsResponse = {
  totalPlays: number;
  uniqueSlugs: number;
  updatedAt: number | null;
  rows: { slug: string; count: number }[];
};

export async function fetchPlayStats(adminToken: string): Promise<PlayStatsResponse> {
  const res = await fetch("/api/stats", {
    headers: { "x-polygons-admin": adminToken },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `stats_http_${res.status}`);
  }
  return res.json() as Promise<PlayStatsResponse>;
}
