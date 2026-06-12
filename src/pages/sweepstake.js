import { flag } from "../components/flags.js";
import { SWEEPSTAKE, normaliseTeamName } from "../data/sweepstake.js";
import { esc } from "../utils.js";

function getTeamStatus(teamName, matches, standings) {
  // Check if champion (won the final)
  const finalMatch = (matches ?? []).find(m => m.stage === "FINAL" && m.status === "FINISHED");
  if (finalMatch) {
    const score = finalMatch.score?.fullTime ?? {};
    const pen   = finalMatch.score?.penalties ?? {};
    const homeTotal = (score.home ?? 0) + (pen.home ?? 0);
    const awayTotal = (score.away ?? 0) + (pen.away ?? 0);
    // Equal totals means we don't have shootout data — don't guess a winner
    if (homeTotal !== awayTotal) {
      const winner = homeTotal > awayTotal
        ? normaliseTeamName(finalMatch.homeTeam?.name)
        : normaliseTeamName(finalMatch.awayTeam?.name);
      if (winner === teamName) return "champion";
    }
  }

  // Check if eliminated: played in a knockout match they lost
  const KNOCKOUT = ["ROUND_OF_32","LAST_16","QUARTER_FINALS","SEMI_FINALS","THIRD_PLACE","FINAL"];
  const knockoutMatches = (matches ?? []).filter(m =>
    KNOCKOUT.includes(m.stage) && m.status === "FINISHED"
  );
  for (const m of knockoutMatches) {
    const home = normaliseTeamName(m.homeTeam?.name ?? "");
    const away = normaliseTeamName(m.awayTeam?.name ?? "");
    if (home !== teamName && away !== teamName) continue;
    const score = m.score?.fullTime ?? {};
    const pen   = m.score?.penalties ?? {};
    const homeTotal = (score.home ?? 0) + (pen.home ?? 0);
    const awayTotal = (score.away ?? 0) + (pen.away ?? 0);
    if (homeTotal === awayTotal) continue; // no shootout data — can't tell who went out
    const loser = homeTotal > awayTotal ? away : home;
    if (loser === teamName && m.stage !== "THIRD_PLACE") return "eliminated";
  }

  // Check group stage elimination (finished group, not in top 2 or advancing 3rd)
  // This is complex — we'll just mark as "active" if they had group matches
  // and let the knockout check handle actual elimination
  return "active";
}

function renderTeamRow(teamName, status) {
  const statusMap = {
    active:    { cls: "status-active", label: "Active" },
    eliminated:{ cls: "status-elim",   label: "Out" },
    champion:  { cls: "status-champ",  label: "🏆 Champion" },
  };
  const s = statusMap[status] ?? statusMap.active;
  return `
    <div class="sweep-team-row ${status === "eliminated" ? "eliminated" : status === "champion" ? "champion" : ""}">
      <span>${flag(teamName)}</span>
      <span>${esc(teamName)}</span>
      <span class="team-status ${s.cls}">${s.label}</span>
    </div>`;
}

function aliveClass(alive, total) {
  if (alive === 0) return "none";
  if (alive === total) return "all";
  return "some";
}

export function renderSweepstakePage(matches, standings) {
  const cards = SWEEPSTAKE.map(({ player, teams }) => {
    const statuses = teams.map(t => getTeamStatus(t, matches, standings));
    const alive = statuses.filter(s => s !== "eliminated").length;

    return `
      <div class="sweep-card">
        <div class="sweep-header">
          <span class="sweep-name">${esc(player)}</span>
          <span class="sweep-alive ${aliveClass(alive, teams.length)}">${alive}/${teams.length} alive</span>
        </div>
        <div class="sweep-teams">
          ${teams.map((t, i) => renderTeamRow(t, statuses[i])).join("")}
        </div>
      </div>`;
  });

  return `<div class="sweep-grid">${cards.join("")}</div>`;
}
