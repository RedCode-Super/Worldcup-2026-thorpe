import { flag } from "../components/flags.js";
import { normaliseTeamName, findPlayerForTeam } from "../data/sweepstake.js";
import { esc } from "../utils.js";

let _view = "list"; // "list" | "bracket"

const ROUND_ORDER = [
  { stage: "ROUND_OF_32",    label: "Round of 32" },
  { stage: "LAST_16",        label: "Round of 16" },
  { stage: "QUARTER_FINALS", label: "Quarter-finals" },
  { stage: "SEMI_FINALS",    label: "Semi-finals" },
  { stage: "THIRD_PLACE",    label: "3rd Place" },
  { stage: "FINAL",          label: "Final" },
];

// Bracket tree display order, derived from ESPN placeholder names.
// Each entry represents one L16 slot with the two R32 positions feeding into it.
// Groups of two L16 slots feed a QF; groups of two QF feed an SF; Final = SF1+SF2.
// Display order (top→bottom): SF1 half first (QF1 then QF2), then SF2 half (QF3 then QF4).
const L16_SEEDS = [
  // QF1 feeds SF1
  { l16: 1, r32: [1, 3]  },
  { l16: 2, r32: [2, 5]  },
  // QF2 feeds SF1
  { l16: 5, r32: [11,12] },
  { l16: 6, r32: [9, 10] },
  // QF3 feeds SF2
  { l16: 3, r32: [4, 6]  },
  { l16: 4, r32: [7, 8]  },
  // QF4 feeds SF2
  { l16: 7, r32: [14,16] },
  { l16: 8, r32: [13,15] },
];
const L16_DISPLAY_ORDER = L16_SEEDS.map(s => s.l16);   // [1,2,5,6, 3,4,7,8]
const QF_DISPLAY_ORDER  = [1, 2, 3, 4];
const SF_DISPLAY_ORDER  = [1, 2];

function getMatchesByStage(matches) {
  const out = {};
  for (const r of ROUND_ORDER) out[r.stage] = [];
  for (const m of matches ?? []) {
    if (out[m.stage]) out[m.stage].push(m);
  }
  for (const list of Object.values(out)) {
    list.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  }
  return out;
}

function isPlaceholder(name) {
  return !name || /Winner|Loser/i.test(name);
}

function winner(match) {
  if (match.status !== "FINISHED") return null;
  const s = match.score?.fullTime ?? {};
  const p = match.score?.penalties ?? {};
  const hg = (s.home ?? 0) + (p.home ?? 0);
  const ag = (s.away ?? 0) + (p.away ?? 0);
  if (hg > ag) return match.homeTeam?.name;
  if (ag > hg) return match.awayTeam?.name;
  return null;
}

// ── Shared match card ──────────────────────────────────────────
function renderBracketTeam(rawName, matchWinner, score) {
  const name    = normaliseTeamName(rawName ?? "TBD");
  const isTBD   = !rawName || isPlaceholder(rawName);
  const isWin   = !isTBD && matchWinner && normaliseTeamName(matchWinner) === name;
  const owner   = isTBD ? null : findPlayerForTeam(name);
  return `
    <div class="bracket-team ${isTBD ? "tbd" : ""} ${isWin ? "winner" : ""}">
      ${isTBD
        ? "TBD"
        : `<span>${flag(name)}</span><span>${esc(name)}</span>${owner ? `<span class="owner-tag" style="font-size:.65rem">${esc(owner)}</span>` : ""}`}
      <span class="bracket-score">${score !== null && score !== undefined ? score : ""}</span>
    </div>`;
}

function renderMatchCard(match) {
  const w  = winner(match);
  const s  = match.score?.fullTime ?? {};
  const hS = match.status === "FINISHED" ? s.home : null;
  const aS = match.status === "FINISHED" ? s.away : null;
  return `
    <div class="bracket-match">
      ${renderBracketTeam(match.homeTeam?.name, w, hS)}
      ${renderBracketTeam(match.awayTeam?.name, w, aS)}
    </div>`;
}

function makeTBD() {
  return `
    <div class="bracket-match">
      <div class="bracket-team tbd">TBD<span class="bracket-score"></span></div>
      <div class="bracket-team tbd">TBD<span class="bracket-score"></span></div>
    </div>`;
}

// ── LIST VIEW ──────────────────────────────────────────────────
function renderListView(byStage) {
  const mainRounds = ROUND_ORDER.filter(r => r.stage !== "THIRD_PLACE");

  const rounds = mainRounds.map(({ stage, label }) => {
    const roundMatches = byStage[stage] ?? [];
    if (roundMatches.length === 0) return "";
    return `
      <div class="bracket-round">
        <div class="round-label">${label}</div>
        <div class="bracket-col">
          ${roundMatches.map(renderMatchCard).join("")}
        </div>
      </div>`;
  }).join("");

  const third = (byStage["THIRD_PLACE"] ?? []);
  const thirdHtml = third.length ? `
    <div class="card" style="margin-top:20px">
      <div class="card-header">3rd Place Play-off</div>
      <div style="padding:12px">${third.map(renderMatchCard).join("")}</div>
    </div>` : "";

  return `<div class="bracket-scroll"><div class="bracket">${rounds}</div></div>${thirdHtml}`;
}

// ── BRACKET TREE VIEW ─────────────────────────────────────────
// CSS flexbox bracket: all round columns are the same height; each slot
// has flex:1 so the spacing auto-aligns pairs to their parent match.
function renderBracketView(byStage) {
  const r32 = byStage["ROUND_OF_32"] ?? [];
  const l16 = byStage["LAST_16"]     ?? [];
  const qf  = byStage["QUARTER_FINALS"] ?? [];
  const sf  = byStage["SEMI_FINALS"] ?? [];
  const fin = byStage["FINAL"]       ?? [];

  // Helper: get match at position i (0-based) in a sorted array, or null
  const at = (arr, i) => arr[i] ?? null;

  // R32 display order derived from L16_SEEDS
  const r32Order = L16_SEEDS.flatMap(s => s.r32.map(p => p - 1)); // 0-based indices
  const l16Order = L16_DISPLAY_ORDER.map(p => p - 1);
  const qfOrder  = QF_DISPLAY_ORDER.map(p => p - 1);
  const sfOrder  = SF_DISPLAY_ORDER.map(p => p - 1);

  const slotHtml = (match) => `<div class="bt-slot">${match ? renderMatchCard(match) : makeTBD()}</div>`;

  const r32Col = `
    <div class="bt-round">
      <div class="round-label">R32</div>
      <div class="bt-slots">
        ${r32Order.map(i => slotHtml(at(r32, i))).join("")}
      </div>
    </div>`;

  const l16Col = `
    <div class="bt-round">
      <div class="round-label">Round of 16</div>
      <div class="bt-slots">
        ${l16Order.map(i => slotHtml(at(l16, i))).join("")}
      </div>
    </div>`;

  const qfCol = `
    <div class="bt-round">
      <div class="round-label">Quarter-finals</div>
      <div class="bt-slots">
        ${qfOrder.map(i => slotHtml(at(qf, i))).join("")}
      </div>
    </div>`;

  const sfCol = `
    <div class="bt-round">
      <div class="round-label">Semi-finals</div>
      <div class="bt-slots">
        ${sfOrder.map(i => slotHtml(at(sf, i))).join("")}
      </div>
    </div>`;

  const finalCol = `
    <div class="bt-round">
      <div class="round-label">Final</div>
      <div class="bt-slots">
        ${slotHtml(at(fin, 0))}
      </div>
    </div>`;

  const thirdPlace = (byStage["THIRD_PLACE"] ?? []);
  const thirdHtml = thirdPlace.length ? `
    <div class="card" style="margin-top:20px">
      <div class="card-header">3rd Place Play-off</div>
      <div style="padding:12px">${thirdPlace.map(renderMatchCard).join("")}</div>
    </div>` : "";

  return `
    <div class="bracket-scroll">
      <div class="bt-bracket">
        ${r32Col}${l16Col}${qfCol}${sfCol}${finalCol}
      </div>
    </div>
    ${thirdHtml}`;
}

// ── Main export ────────────────────────────────────────────────
export function renderKnockoutPage(matches, container) {
  const byStage = getMatchesByStage(matches);

  const hasKnockout = ROUND_ORDER.some(r =>
    r.stage !== "THIRD_PLACE" && (byStage[r.stage]?.length ?? 0) > 0
  );

  const toggleHtml = `
    <div class="filter-bar" style="margin-bottom:16px">
      <button class="filter-btn ${_view === "list"    ? "active" : ""}" data-ko-view="list">List</button>
      <button class="filter-btn ${_view === "bracket" ? "active" : ""}" data-ko-view="bracket">Bracket</button>
    </div>`;

  if (!hasKnockout) {
    const html = `
      ${toggleHtml}
      <div class="state-msg">
        <h3>Knockout stage not started yet</h3>
        <p>The bracket will appear once the group stage is complete.</p>
      </div>`;
    if (container) {
      container.innerHTML = html;
      attachToggle(matches, container);
    }
    return html;
  }

  const content = _view === "bracket"
    ? renderBracketView(byStage)
    : renderListView(byStage);

  const html = toggleHtml + content;
  if (container) {
    container.innerHTML = html;
    attachToggle(matches, container);
  }
  return html;
}

function attachToggle(matches, container) {
  container.querySelectorAll("[data-ko-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      _view = btn.dataset.koView;
      renderKnockoutPage(matches, container);
    });
  });
}
