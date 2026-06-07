// Reads pre-fetched static JSON files updated by GitHub Actions.
// No API key required in the browser — all fetching happens server-side.

export async function fetchStandings() {
  const res = await fetch("data/standings.json?t=" + Date.now());
  if (!res.ok) throw new Error("standings_not_found");
  const data = await res.json();
  if (data.errorCode) throw new Error(`api_error:${data.errorCode}:${data.message}`);
  return data;
}

export async function fetchMatches() {
  const res = await fetch("data/matches.json?t=" + Date.now());
  if (!res.ok) throw new Error("matches_not_found");
  const data = await res.json();
  if (data.errorCode) throw new Error(`api_error:${data.errorCode}:${data.message}`);
  return data;
}
