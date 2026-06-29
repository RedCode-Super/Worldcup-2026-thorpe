import { flag } from "../components/flags.js";
import { normaliseTeamName, findPlayerForTeam } from "../data/sweepstake.js";
import { esc } from "../utils.js";

let _view = "list"; // "list" | "bracket"

const STAGE_LABEL = {
  ROUND_OF_32:    "Round of 32",
  LAST_16:        "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS:    "Semi-finals",
  THIRD_PLACE:    "3rd Place",
  FINAL:          "Final",
};

const KNOCKOUT_STAGES = ["ROUND_OF_32","LAST_16","QUARTER_FINALS","SEMI_FINALS","FINAL"];

// ── Placeholder parsing ────────────────────────────────────────
// ESPN encodes bracket structure in team names: "Round of 32 3 Winner" etc.
function parseBracketRef(name) {
  if (!name) return null;
  let m;
  m = name.match(/^Round of 32\s+(\d+)\s+Winner$/i);
  if (m) return { stage: "ROUND_OF_32",    pos: +m[1] };
  m = name.match(/^Round of 16\s+(\d+)\s+Winner$/i);
  if (m) return { stage: "LAST_16",        pos: +m[1] };
  m = name.match(/^Quarterfinal\s+(\d+)\s+Winner$/i);
  if (m) return { stage: "QUARTER_FINALS", pos: +m[1] };
  m = name.match(/^Semifinal\s+(\d+)\s+Winner$/i);
  if (m) return { stage: "SEMI_FINALS",    pos: +m[1] };
  return null;
}

function isPlaceholderName(name) { return !!parseBracketRef(name) || /Loser$/i.test(name ?? ""); }

// ── Stage→position maps ────────────────────────────────────────
// Sort each stage by date; position = 1-based index.
function buildStageMaps(matches) {
  const raw = {};
  for (const m of matches ?? []) {
    if (!KNOCKOUT_STAGES.includes(m.stage)) continue;
    (raw[m.stage] ??= []).push(m);
  }
  const maps = {};
  for (const [s, list] of Object.entries(raw)) {
    list.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    maps[s] = {};
    list.forEach((m, i) => { maps[s][i + 1] = m; });
  }
  return maps;
}

// ── Bracket tree ───────────────────────────────────────────────
// Recursively builds a node tree from the Final down to R32,
// using ESPN's placeholder team names to determine parent↔child links.
// { match, stage, pos, children: [node, node] }
function buildNode(maps, stage, pos) {
  const match = maps[stage]?.[pos] ?? null;
  if (stage === "ROUND_OF_32" || !match) {
    return { match, stage, pos, children: [] };
  }
  const children = [];
  for (const side of ["homeTeam", "awayTeam"]) {
    const ref = parseBracketRef(match[side]?.name);
    if (ref) children.push(buildNode(maps, ref.stage, ref.pos));
  }
  return { match, stage, pos, children };
}

// Flatten tree into ordered columns (leaf→root = R32→Final).
// Returns Map<stageKey, node[]> in correct visual top-to-bottom order.
function flattenToColumns(root) {
  const cols = {};
  function walk(node) {
    if (!cols[node.stage]) cols[node.stage] = [];
    // Children first (DFS left→right = top→bottom display order)
    for (const c of node.children) walk(c);
    cols[node.stage].push(node);
  }
  // Walk from root (Final) but collect in leaf-first order
  function dfs(node) {
    for (const c of node.children) dfs(c);
    (cols[node.stage] ??= []).push(node);
  }
  // We want R32 (leaves) displayed top→bottom in bracket order.
  // DFS from Final's left subtree to right subtree gives us that.
  dfs(root);
  return cols;
}

// ── Match card rendering ───────────────────────────────────────
function winner(match) {
  if (!match || match.status !== "FINISHED") return null;
  const s = match.score?.fullTime ?? {};
  const p = match.score?.penalties ?? {};
  const hg = (s.home ?? 0) + (p.home ?? 0);
  const ag = (s.away ?? 0) + (p.away ?? 0);
  if (hg > ag) return match.homeTeam?.name;
  if (ag > hg) return match.awayTeam?.name;
  return null;
}

function renderTeamRow(rawName, matchWinner, score) {
  const isTBD  = !rawName || isPlaceholderName(rawName);
  const name   = isTBD ? null : normaliseTeamName(rawName);
  const isWin  = name && matchWinner && normaliseTeamName(matchWinner) === name;
  const owner  = name ? findPlayerForTeam(name) : null;
  return `
    <div class="bracket-team ${isTBD ? "tbd" : ""} ${isWin ? "winner" : ""}">
      ${isTBD
        ? "TBD"
        : `<span>${flag(name)}</span><span>${esc(name)}</span>${owner ? `<span class="owner-tag" style="font-size:.65rem">${esc(owner)}</span>` : ""}`}
      <span class="bracket-score">${Number(score) >= 0 ? Number(score) : ""}</span>
    </div>`;
}

function renderMatchCard(match) {
  if (!match) return `
    <div class="bracket-match">
      <div class="bracket-team tbd">TBD<span class="bracket-score"></span></div>
      <div class="bracket-team tbd">TBD<span class="bracket-score"></span></div>
    </div>`;
  const w  = winner(match);
  const s  = match.score?.fullTime ?? {};
  const hS = match.status === "FINISHED" ? s.home : null;
  const aS = match.status === "FINISHED" ? s.away : null;
  return `
    <div class="bracket-match">
      ${renderTeamRow(match.homeTeam?.name, w, hS)}
      ${renderTeamRow(match.awayTeam?.name, w, aS)}
    </div>`;
}

// ── LIST VIEW ─────────────────────────────────────────────────
function renderListView(maps) {
  const mainStages = KNOCKOUT_STAGES;
  const rounds = mainStages.map(stage => {
    const entries = Object.values(maps[stage] ?? {});
    if (!entries.length) return "";
    return `
      <div class="bracket-round">
        <div class="round-label">${esc(STAGE_LABEL[stage] ?? stage)}</div>
        <div class="bracket-col">
          ${entries.map(m => renderMatchCard(m)).join("")}
        </div>
      </div>`;
  }).join("");

  return `<div class="bracket-scroll"><div class="bracket">${rounds}</div></div>`;
}

// ── BRACKET TREE VIEW ─────────────────────────────────────────
function renderBracketView(maps) {
  // Find the Final match (pos 1) to root the tree
  const finalMatch = maps["FINAL"]?.[1] ?? null;
  if (!finalMatch) {
    // No Final seeding data yet — fall back to column layout without connections
    return renderListView(maps);
  }

  const root = buildNode(maps, "FINAL", 1);
  const cols  = flattenToColumns(root);

  const colOrder = ["ROUND_OF_32","LAST_16","QUARTER_FINALS","SEMI_FINALS","FINAL"];
  const colHtml  = colOrder.map(stage => {
    const nodes = cols[stage];
    if (!nodes?.length) return "";
    return `
      <div class="bt-round">
        <div class="round-label">${esc(stage === "ROUND_OF_32" ? "R32" : (STAGE_LABEL[stage] ?? stage))}</div>
        <div class="bt-slots">
          ${nodes.map(n => `<div class="bt-slot">${renderMatchCard(n.match)}</div>`).join("")}
        </div>
      </div>`;
  }).join("");

  return `<div class="bracket-scroll"><div class="bt-bracket">${colHtml}</div></div>`;
}

// ── Main export ────────────────────────────────────────────────
export function renderKnockoutPage(matches, container) {
  const maps = buildStageMaps(matches);

  // Third-place is separate from the main bracket
  const thirdList = (matches ?? [])
    .filter(m => m.stage === "THIRD_PLACE" && !m.placeholder)
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  const hasKnockout = KNOCKOUT_STAGES.some(s => Object.keys(maps[s] ?? {}).length > 0);

  const toggleHtml = `
    <div class="filter-bar" style="margin-bottom:16px">
      <button class="filter-btn ${_view === "list"    ? "active" : ""}" data-ko-view="list">List</button>
      <button class="filter-btn ${_view === "bracket" ? "active" : ""}" data-ko-view="bracket">Bracket</button>
    </div>`;

  if (!hasKnockout) {
    const html = `${toggleHtml}
      <div class="state-msg">
        <h3>Knockout stage not started yet</h3>
        <p>The bracket will appear once the group stage is complete.</p>
      </div>`;
    if (container) { container.innerHTML = html; attachToggle(matches, container); }
    return html;
  }

  const thirdHtml = thirdList.length ? `
    <div class="card" style="margin-top:20px">
      <div class="card-header">3rd Place Play-off</div>
      <div style="padding:12px">${thirdList.map(renderMatchCard).join("")}</div>
    </div>` : "";

  const content = _view === "bracket" ? renderBracketView(maps) : renderListView(maps);
  const html = toggleHtml + content + thirdHtml;

  if (container) { container.innerHTML = html; attachToggle(matches, container); }
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
