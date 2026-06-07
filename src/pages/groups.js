import { flag } from "../components/flags.js";
import { normaliseTeamName, findPlayerForTeam } from "../data/sweepstake.js";
import { esc } from "../utils.js";
import { STATIC_GROUPS } from "../data/groups-static.js";

function positionClass(pos, total) {
  if (pos <= 2) return "qualify-auto";
  if (pos === 3) return "qualify-maybe";
  return "";
}

function renderStandingsRow(entry) {
  const team  = normaliseTeamName(entry.team.name);
  const owner = findPlayerForTeam(team);
  const s     = entry.statistics ?? entry;

  return `
    <tr class="${positionClass(entry.position, 4)}">
      <td>
        <div class="team-cell">
          <span class="team-flag">${flag(team)}</span>
          <span>${esc(team)}</span>
          ${owner ? `<span class="owner-tag">${esc(owner)}</span>` : ""}
        </div>
      </td>
      <td>${s.playedGames ?? 0}</td>
      <td>${s.won ?? 0}</td>
      <td>${s.draw ?? 0}</td>
      <td>${s.lost ?? 0}</td>
      <td>${s.goalsFor ?? 0}</td>
      <td>${s.goalsAgainst ?? 0}</td>
      <td>${s.goalDifference ?? 0}</td>
      <td class="pts">${s.points ?? 0}</td>
    </tr>`;
}

function renderGroup(group) {
  const rows = (group.table ?? []).map(renderStandingsRow).join("");
  return `
    <div class="card">
      <div class="card-header">Group ${esc(group.group ?? group.stage)}</div>
      <table class="standings-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderLegend() {
  return `
    <div class="legend">
      <span><span class="legend-dot" style="background:var(--green)"></span>Qualify (top 2)</span>
      <span><span class="legend-dot" style="background:var(--amber)"></span>Best 3rd (may qualify)</span>
    </div>`;
}

function renderStaticGroup(group) {
  const rows = group.teams.map(team => {
    const owner = findPlayerForTeam(team);
    return `
      <tr>
        <td>
          <div class="team-cell">
            <span class="team-flag">${flag(team)}</span>
            <span>${esc(team)}</span>
            ${owner ? `<span class="owner-tag">${esc(owner)}</span>` : ""}
          </div>
        </td>
        <td>0</td><td>0</td><td>0</td><td>0</td>
        <td>0</td><td>0</td><td>0</td>
        <td class="pts">0</td>
      </tr>`;
  }).join("");

  return `
    <div class="card">
      <div class="card-header">Group ${esc(group.group)}</div>
      <table class="standings-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function renderGroupsPage(standings) {
  if (!standings || standings.length === 0) {
    return renderLegend() + STATIC_GROUPS.map(renderStaticGroup).join("");
  }
  const groups = standings.filter(s => s.type === "TOTAL" || s.stage === "GROUP_STAGE");
  return renderLegend() + groups.map(renderGroup).join("");
}
