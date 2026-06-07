// Loads static JSON files written by GitHub Actions (runs every 45 min).
// Caches in sessionStorage so page navigations don't re-fetch.
import { fetchStandings, fetchMatches } from "./api.js";

const CACHE_TTL_MS = 5 * 60_000; // 5 min session cache (GH Actions updates every 45 min)

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
    const [s, m] = await Promise.all([fetchStandings(), fetchMatches()]);
    _standings = s.standings ?? s;
    _matches   = m.matches   ?? m;
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
