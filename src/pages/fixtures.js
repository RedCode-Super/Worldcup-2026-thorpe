import { flag } from "../components/flags.js";
import { normaliseTeamName, findPlayerForTeam, SWEEPSTAKE } from "../data/sweepstake.js";
import { esc } from "../utils.js";
import { STATIC_FIXTURES } from "../data/fixtures-static.js";

let _activeFilter  = "all";
let _selectedFilter = "all"; // "all" | "player:Durham" | "team:Mexico"

const FILTERS = [
  { id: "all",      label: "All" },
  { id: "live",     label: "🔴 Live" },
  { id: "today",    label: "Today" },
  { id: "group",    label: "Group Stage" },
  { id: "knockout", label: "Knockout" },
];

const GROUP_STAGES   = ["GROUP_STAGE"];
const KNOCKOUT_TYPES = ["ROUND_OF_32","LAST_16","QUARTER_FINALS","SEMI_FINALS","THIRD_PLACE","FINAL"];

function localDateKey(utcDate) {
  const d = new Date(utcDate);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDateLabel(localKey) {
  const [y, mo, d] = localKey.split("-").map(Number);
  return new Date(y, mo - 1, d, 12).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function formatKickoff(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(match) {
  switch (match.status) {
    case "IN_PLAY":  return `<span class="live-dot"></span>${esc(match.minute ?? "")}′`;
    case "PAUSED":   return `<span class="live-dot"></span>HT`;
    case "FINISHED": return "FT";
    default:         return formatKickoff(match.utcDate);
  }
}

function cardClass(match) {
  if (match.status === "IN_PLAY" || match.status === "PAUSED") return "fixture-card live";
  if (match.status === "FINISHED") return "fixture-card ft";
  return "fixture-card tbd";
}

function channelClass(ch) {
  return ch?.startsWith("BBC") ? "ch-bbc" : "ch-itv";
}

function renderScore(match) {
  const s = match.score?.fullTime ?? {};
  if (match.status === "IN_PLAY" || match.status === "PAUSED") {
    return `${match.score?.currentScore?.home ?? s.home ?? "–"} – ${match.score?.currentScore?.away ?? s.away ?? "–"}`;
  }
  if (match.status === "FINISHED") return `${s.home ?? "–"} – ${s.away ?? "–"}`;
  return "vs";
}

// Returns the set of teams to highlight/filter for the current selection
function getSelectedTeams() {
  if (_selectedFilter === "all") return null;
  if (_selectedFilter.startsWith("player:")) {
    const name = _selectedFilter.slice(7);
    return SWEEPSTAKE.find(s => s.player === name)?.teams ?? null;
  }
  if (_selectedFilter.startsWith("team:")) {
    return [_selectedFilter.slice(5)];
  }
  return null;
}

function matchInSelection(m) {
  const teams = getSelectedTeams();
  if (!teams) return true;
  const home = normaliseTeamName(m.homeTeam?.name ?? "");
  const away = normaliseTeamName(m.awayTeam?.name ?? "");
  return teams.includes(home) || teams.includes(away);
}

function getAllTeams() {
  const t = new Set();
  for (const f of STATIC_FIXTURES) {
    t.add(normaliseTeamName(f.homeTeam.name));
    t.add(normaliseTeamName(f.awayTeam.name));
  }
  return [...t].sort();
}

function buildSelectOptions() {
  const players = SWEEPSTAKE.map(s => s.player);
  const teams   = getAllTeams();
  return `
    <option value="all">Everyone</option>
    <optgroup label="── Players ──">
      ${players.map(p => `<option value="player:${esc(p)}"${_selectedFilter === `player:${p}` ? " selected" : ""}>${esc(p)}</option>`).join("")}
    </optgroup>
    <optgroup label="── Teams ──">
      ${teams.map(t => `<option value="team:${esc(t)}"${_selectedFilter === `team:${t}` ? " selected" : ""}>${flag(t)} ${esc(t)}</option>`).join("")}
    </optgroup>`;
}

function renderFixtureCard(match) {
  const home = normaliseTeamName(match.homeTeam?.name ?? "TBD");
  const away = normaliseTeamName(match.awayTeam?.name ?? "TBD");
  const hlTeams = getSelectedTeams();
  const homeHL = hlTeams?.includes(home) ? " team-hl" : "";
  const awayHL = hlTeams?.includes(away) ? " team-hl" : "";
  const homeOwner = findPlayerForTeam(home);
  const awayOwner = findPlayerForTeam(away);
  const roundLabel = (match.stage ?? "").replace(/_/g, " ").toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  return `
    <div class="${cardClass(match)}">
      <div class="fixture-team home${homeHL}">
        <span class="team-flag">${flag(home)}</span>
        <span>${esc(home)}</span>
      </div>
      <div>
        <div class="fixture-score">${renderScore(match)}</div>
        <div class="fixture-time">${statusLabel(match)}</div>
      </div>
      <div class="fixture-team away${awayHL}">
        <span>${esc(away)}</span>
        <span class="team-flag">${flag(away)}</span>
      </div>
      <div class="fixture-meta">
        <span>${esc(roundLabel)}</span>
        ${homeOwner ? `<span class="owner-home">${esc(homeOwner)}</span>` : ""}
        ${awayOwner ? `<span class="owner-away">${esc(awayOwner)}</span>` : ""}
        ${match.channel ? `<span class="fixture-ch ${channelClass(match.channel)}">${esc(match.channel)}</span>` : ""}
      </div>
    </div>`;
}

function applyFilters(source) {
  let out = source;
  switch (_activeFilter) {
    case "live":     out = out.filter(m => m.status === "IN_PLAY" || m.status === "PAUSED"); break;
    case "today":    out = out.filter(m => isToday(m.utcDate)); break;
    case "group":    out = out.filter(m => GROUP_STAGES.includes(m.stage)); break;
    case "knockout": out = out.filter(m => KNOCKOUT_TYPES.includes(m.stage)); break;
  }
  if (_selectedFilter !== "all") out = out.filter(matchInSelection);
  return out;
}

function groupByLocalDate(matches) {
  const sorted = [...matches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  const map = new Map();
  for (const m of sorted) {
    const key = localDateKey(m.utcDate);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  }
  return map;
}

export function renderFixturesPage(matches, container) {
  const isUnknown = name => !name || /Winner|Loser/i.test(name);
  const source  = (matches?.length ? matches : STATIC_FIXTURES)
    .filter(m => !m.placeholder || !isUnknown(m.homeTeam?.name) || !isUnknown(m.awayTeam?.name));
  const filtered = applyFilters(source);
  const byDate  = groupByLocalDate(filtered);

  const controls = `
    <div class="fixtures-controls">
      <div class="filter-bar">
        ${FILTERS.map(f => `
          <button class="filter-btn ${_activeFilter === f.id ? "active" : ""}"
                  data-filter="${f.id}">${f.label}</button>
        `).join("")}
      </div>
      <select id="fixturesTeamSelect" class="tv-select">
        ${buildSelectOptions()}
      </select>
    </div>`;

  let dateGroups = "";
  if (byDate.size === 0) {
    dateGroups = `<div class="state-msg"><p>No matches for this filter.</p></div>`;
  } else {
    for (const [key, dayMatches] of byDate) {
      dateGroups += `
        <div class="date-group">
          <div class="date-label">${formatDateLabel(key)}</div>
          ${dayMatches.map(renderFixtureCard).join("")}
        </div>`;
    }
  }

  if (container) {
    container.innerHTML = controls + dateGroups;
    container.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        _activeFilter = btn.dataset.filter;
        renderFixturesPage(matches, container);
      });
    });
    container.querySelector("#fixturesTeamSelect")?.addEventListener("change", e => {
      _selectedFilter = e.target.value;
      renderFixturesPage(matches, container);
    });
  }
}

export function resetFixturesFilter() {
  _activeFilter   = "all";
  _selectedFilter = "all";
}
