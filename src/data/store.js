// Loads the static matches.json written by GitHub Actions (runs nightly).
// ESPN's feed only covers a rolling date window, so we overlay its scores
// onto the full hardcoded schedule (STATIC_FIXTURES) — that way every page
// shows the complete fixture list with live results merged in.
// Group standings are computed client-side from matches (see pages/groups.js),
// so there is no separate standings feed to fetch.
// Caches in sessionStorage so page navigations don't re-fetch.
import { fetchMatches } from "./api.js";
import { STATIC_FIXTURES } from "./fixtures-static.js";
import { normaliseTeamName } from "./sweepstake.js";

const CACHE_TTL_MS = 5 * 60_000; // 5 min session cache

// Overlay ESPN results onto the full static schedule, matching fixtures by
// (home, away) team names. Live-only matches with no static counterpart
// (e.g. future knockout ties) are appended so nothing is lost.
function mergeFixtures(espnMatches) {
  const keyOf = m => `${normaliseTeamName(m.homeTeam?.name ?? "")}|${normaliseTeamName(m.awayTeam?.name ?? "")}`;
  const liveByKey = new Map((espnMatches ?? []).map(m => [keyOf(m), m]));

  const merged = STATIC_FIXTURES.map(f => {
    const lm = liveByKey.get(keyOf(f));
    if (!lm) return f;
    liveByKey.delete(keyOf(f));
    return { ...f, status: lm.status ?? f.status, score: lm.score ?? f.score, minute: lm.minute };
  });
  for (const lm of liveByKey.values()) merged.push(lm); // unmatched (knockouts etc.)
  return merged;
}

let _standings = null;
let _matches   = null;
let _error     = null;
let _loading   = true;
let _fetchedAt = null;
const _listeners = new Set();

function notify() {
  _listeners.forEach(fn => fn({ standings: _standings, matches: _matches, error: _error, loading: _loading, fetchedAt: _fetchedAt }));
}

export function subscribe(fn) {
  _listeners.add(fn);
  fn({ standings: _standings, matches: _matches, error: _error, loading: _loading, fetchedAt: _fetchedAt });
  return () => _listeners.delete(fn);
}

export function getState() {
  return { standings: _standings, matches: _matches, error: _error, loading: _loading, fetchedAt: _fetchedAt };
}

function saveCache(s, m) {
  try {
    sessionStorage.setItem("wc_standings", JSON.stringify({ data: s, at: Date.now() }));
    sessionStorage.setItem("wc_matches",   JSON.stringify({ data: m, at: Date.now() }));
  } catch {}
}

function loadCache() {
  try {
    const sc = JSON.parse(sessionStorage.getItem("wc_standings") ?? "null");
    const mc = JSON.parse(sessionStorage.getItem("wc_matches")   ?? "null");
    if (sc && mc && (Date.now() - sc.at) < CACHE_TTL_MS) {
      return { standings: sc.data, matches: mc.data, at: sc.at };
    }
  } catch {}
  return null;
}

async function doFetch() {
  try {
    const m = await fetchMatches();
    _matches   = mergeFixtures(m.matches ?? m);
    _standings = null; // computed from matches in pages/groups.js
    _fetchedAt = Date.now();
    _error     = null;
    saveCache(_standings, _matches);
  } catch (e) {
    _error = e.message;
  }
  _loading = false;
  notify();
}

export function init() {
  const cached = loadCache();
  if (cached) {
    _standings = cached.standings;
    _matches   = cached.matches;
    _fetchedAt = cached.at;
    _loading   = false;
    notify();
    return;
  }
  doFetch();
}

export function forceRefresh() {
  sessionStorage.removeItem("wc_standings");
  sessionStorage.removeItem("wc_matches");
  _loading = true;
  notify();
  doFetch();
}
