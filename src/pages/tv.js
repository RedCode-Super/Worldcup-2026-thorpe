import { flag } from "../components/flags.js";
import { esc } from "../utils.js";
import { STATIC_FIXTURES } from "../data/fixtures-static.js";
import { normaliseTeamName, SWEEPSTAKE } from "../data/sweepstake.js";

let _selectedFilter = "all"; // "all" | "player:Durham" | "team:Mexico"

function getAllTeams() {
  const t = new Set();
  for (const f of STATIC_FIXTURES) {
    t.add(normaliseTeamName(f.homeTeam.name));
    t.add(normaliseTeamName(f.awayTeam.name));
  }
  return [...t].sort();
}

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

function channelClass(ch) {
  return ch?.startsWith("BBC") ? "ch-bbc" : "ch-itv";
}

function localDateKey(utcDate) {
  const d = new Date(utcDate);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function isTodayKey(key) {
  return key === localDateKey(new Date().toISOString());
}

function formatDateLabel(key) {
  const [y, mo, d] = key.split("-").map(Number);
  return new Date(y, mo - 1, d, 12).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(utcDate) {
  return new Date(utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function groupByLocalDate(fixtures) {
  const map = new Map();
  for (const f of [...fixtures].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))) {
    const key = localDateKey(f.utcDate);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  }
  return map;
}

function renderRow(f) {
  const home = normaliseTeamName(f.homeTeam.name);
  const away = normaliseTeamName(f.awayTeam.name);
  const hlTeams = getSelectedTeams();
  const homeHL = hlTeams?.includes(home) ? " tv-hl" : "";
  const awayHL = hlTeams?.includes(away) ? " tv-hl" : "";

  return `
    <div class="tv-row">
      <span class="tv-time">${formatTime(f.utcDate)}</span>
      <span class="tv-teams">
        <span class="tv-team${homeHL}">${flag(home)} ${esc(home)}</span>
        <span class="tv-vs">vs</span>
        <span class="tv-team${awayHL}">${flag(away)} ${esc(away)}</span>
      </span>
      ${f.channel ? `<span class="tv-ch ${channelClass(f.channel)}">${esc(f.channel)}</span>` : ""}
    </div>`;
}

export function renderTvPage(matches, container) {
  const fixtures = matches?.length ? matches : STATIC_FIXTURES;
  const hlTeams  = getSelectedTeams();

  const filtered = (
    hlTeams
      ? fixtures.filter(f =>
          hlTeams.includes(normaliseTeamName(f.homeTeam.name)) ||
          hlTeams.includes(normaliseTeamName(f.awayTeam.name))
        )
      : [...fixtures]
  ).sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  const hasTodaySection = filtered.some(f => isTodayKey(localDateKey(f.utcDate)));

  const controls = `
    <div class="tv-controls">
      <div class="tv-controls-row">
        <select id="tvFilterSelect" class="tv-select">
          ${buildSelectOptions()}
        </select>
        ${hasTodaySection ? `<button class="filter-btn active" id="tvJumpToday">Jump to today</button>` : ""}
      </div>
    </div>`;

  let body = "";
  if (filtered.length === 0) {
    body = `<div class="state-msg"><p>No fixtures found.</p></div>`;
  } else {
    for (const [key, dayFixtures] of groupByLocalDate(filtered)) {
      const today = isTodayKey(key);
      body += `
        <div class="tv-day${today ? " tv-day-today" : ""}">
          <div class="date-label">
            ${esc(formatDateLabel(key))}
            ${today ? `<span class="today-badge">TODAY</span>` : ""}
          </div>
          ${dayFixtures.map(renderRow).join("")}
        </div>`;
    }
  }

  if (container) {
    container.innerHTML = controls + body;
    container.querySelector("#tvFilterSelect")?.addEventListener("change", e => {
      _selectedFilter = e.target.value;
      renderTvPage(matches, container);
    });
    container.querySelector("#tvJumpToday")?.addEventListener("click", () => {
      container.querySelector(".tv-day-today")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

export function resetTvFilter() { _selectedFilter = "all"; }
