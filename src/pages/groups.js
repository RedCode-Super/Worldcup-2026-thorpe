import { flag } from "../components/flags.js";
import { normaliseTeamName, findPlayerForTeam } from "../data/sweepstake.js";
import { esc } from "../utils.js";
import { STATIC_GROUPS } from "../data/groups-static.js";
import { calcGroupStandings } from "../data/standings.js";

function positionClass(pos, total) {
  if (pos <= 2) return "qualify-auto";
  if (pos === 3) return "qualify-maybe";
  return "";
}

function renderLegend() {
  return `
    <div class="legend">
      <span><span class="legend-dot" style="background:var(--green)"></span>Qualify (top 2)</span>
      <span><span class="legend-dot" style="background:var(--amber)"></span>Best 3rd (may qualify)</span>
    </div>`;
}

function renderGroup(group, matches) {
  const table = calcGroupStandings(group.teams, matches);
  const rows = table.map((entry, i) => {
    const owner = findPlayerForTeam(entry.team);
    const gd    = entry.gf - entry.ga;
    return `
      <tr class="${positionClass(i + 1, 4)}">
        <td>
          <div class="team-cell">
            <span class="team-flag">${flag(entry.team)}</span>
            <span>${esc(entry.team)}</span>
            ${owner ? `<span class="owner-tag">${esc(owner)}</span>` : ""}
          </div>
        </td>
        <td>${entry.p}</td>
        <td>${entry.w}</td>
        <td>${entry.d}</td>
        <td>${entry.l}</td>
        <td>${entry.gf}</td>
        <td>${entry.ga}</td>
        <td>${gd > 0 ? "+" : ""}${gd}</td>
        <td class="pts">${entry.pts}</td>
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

export function renderGroupsPage(matches) {
  return renderLegend() + STATIC_GROUPS.map(g => renderGroup(g, matches)).join("");
}
