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
// (day, home, away). The day is part of the key so a knockout rematch of a
// group pairing can't overwrite the group fixture's score. Live-only matches
// with no static counterpart (knockout ties) are appended once both teams
// are decided — ESPN lists undecided ties with placeholder "teams" like
// "Group A Winner", which we skip rather than render.
function mergeFixtures(espnMatches) {
  const keyOf = m => `${(m.utcDate ?? "").slice(0, 10)}|${normaliseTeamName(m.homeTeam?.name ?? "")}|${normaliseTeamName(m.awayTeam?.name ?? "")}`;
  const liveByKey = new Map((espnMatches ?? []).map(m => [keyOf(m), m]));

  const realTeams = new Set();
  for (const f of STATIC_FIXTURES) {
    realTeams.add(normaliseTeamName(f.homeTeam.name));
    realTeams.add(normaliseTeamName(f.awayTeam.name));
  }

  const merged = STATIC_FIXTURES.map(f => {
    const lm = liveByKey.get(keyOf(f));
    if (!lm) return f;
    liveByKey.delete(keyOf(f));
    return { ...f, status: lm.status ?? f.status, score: lm.score ?? f.score, minute: lm.minute };
  });
  for (const lm of liveByKey.values()) {
    const home = normaliseTeamName(lm.homeTeam?.name ?? "");
    const away = normaliseTeamName(lm.awayTeam?.name ?? "");
    if (realTeams.has(home) && realTeams.has(away)) {
      merged.push(lm); // knockout match with real teams (round in progress)
    } else if (lm.stage && lm.stage !== "GROUP_STAGE") {
      // Placeholder knockout slot (teams not yet decided). Kept so the
      // bracket tree can show connections and derive its structure from
      // ESPN's seeding data. Marked so fixtures page can hide them.
      merged.push({ ...lm, placeholder: true });
    }
  }
  return merged;
}

let _matches   = null;
let _error     = null;
let _loading   = true;
let _fetchedAt = null;
const _listeners = new Set();

// Bump the version segment whenever the cached data shape changes, so a
// deploy never feeds old-shape cache to new code.
const CACHE_KEY = "wc_matches_v4";
const OLD_CACHE_KEYS = ["wc_matches", "wc_standings", "wc_matches_v2", "wc_matches_v3"];

function notify() {
  _listeners.forEach(fn => fn({ matches: _matches, error: _error, loading: _loading, fetchedAt: _fetchedAt }));
}

export function subscribe(fn) {
  _listeners.add(fn);
  fn({ matches: _matches, error: _error, loading: _loading, fetchedAt: _fetchedAt });
  return () => _listeners.delete(fn);
}

export function getState() {
  return { matches: _matches, error: _error, loading: _loading, fetchedAt: _fetchedAt };
}

function saveCache(m) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: m, at: Date.now() }));
  } catch {}
}

function loadCache() {
  try {
    const mc = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null");
    if (mc && (Date.now() - mc.at) < CACHE_TTL_MS) {
      return { matches: mc.data, at: mc.at };
    }
  } catch {}
  return null;
}

async function doFetch() {
  try {
    const m = await fetchMatches();
    _matches   = mergeFixtures(m.matches ?? m);
    _fetchedAt = Date.now();
    _error     = null;
    saveCache(_matches);
  } catch (e) {
    _error = e.message;
  }
  _loading = false;
  notify();
}

export function init() {
  try { OLD_CACHE_KEYS.forEach(k => sessionStorage.removeItem(k)); } catch {}
  const cached = loadCache();
  if (cached) {
    _matches   = cached.matches;
    _fetchedAt = cached.at;
    _loading   = false;
    notify();
    return;
  }
  doFetch();
}

export function forceRefresh() {
  sessionStorage.removeItem(CACHE_KEY);
  _loading = true;
  notify();
  doFetch();
}
