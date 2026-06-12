import { flag } from "../components/flags.js";
import { normaliseTeamName, findPlayerForTeam } from "../data/sweepstake.js";
import { esc } from "../utils.js";
import { STATIC_GROUPS } from "../data/groups-static.js";
import { STATIC_FIXTURES } from "../data/fixtures-static.js";

function calcGroupStandings(teams, matches) {
  const source = matches ?? STATIC_FIXTURES;
  const stats = {};
  for (const t of teams) {
    stats[t] = { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  }
  for (const f of source) {
    if (f.status !== "FINISHED") continue;
    const home = normaliseTeamName(f.homeTeam.name);
    const away = normaliseTeamName(f.awayTeam.name);
    if (!stats[home] || !stats[away]) continue;
    const hg = f.score.fullTime.home;
    const ag = f.score.fullTime.away;
    if (hg === null || ag === null) continue;
    stats[home].p++; stats[away].p++;
    stats[home].gf += hg; stats[home].ga += ag;
    stats[away].gf += ag; stats[away].ga += hg;
    if (hg > ag) {
      stats[home].w++; stats[home].pts += 3; stats[away].l++;
    } else if (ag > hg) {
      stats[away].w++; stats[away].pts += 3; stats[home].l++;
    } else {
      stats[home].d++; stats[home].pts++;
      stats[away].d++; stats[away].pts++;
    }
  }
  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });
}

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

function renderStaticGroup(group, matches) {
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

export function renderGroupsPage(standings, matches) {
  if (!standings || standings.length === 0) {
    return renderLegend() + STATIC_GROUPS.map(g => renderStaticGroup(g, matches)).join("");
  }
  const groups = standings.filter(s => s.type === "TOTAL" || s.stage === "GROUP_STAGE");
  return renderLegend() + groups.map(renderGroup).join("");
}
