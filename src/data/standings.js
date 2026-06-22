// Group-stage standings shared by the Groups and Sweepstake pages.
import { normaliseTeamName } from "./sweepstake.js";
import { STATIC_GROUPS } from "./groups-static.js";
import { STATIC_FIXTURES } from "./fixtures-static.js";

const THIRD_PLACE_QUALIFIERS = 8; // best 8 of 12 group-runners-up advance

export function calcGroupStandings(teams, matches) {
  const source = matches ?? STATIC_FIXTURES;
  const stats = {};
  for (const t of teams) {
    stats[t] = { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  }
  for (const f of source) {
    if (f.status !== "FINISHED") continue;
    if (f.stage && f.stage !== "GROUP_STAGE") continue; // knockout rematches don't count
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

// True once every group-stage fixture has a final result. Cross-group
// third-place ranking only makes sense once all 12 groups are done, so we
// don't attempt it before then.
export function isGroupStageComplete(matches) {
  const groupMatches = (matches ?? []).filter(m => m.stage === "GROUP_STAGE");
  return groupMatches.length === STATIC_FIXTURES.length
    && groupMatches.every(m => m.status === "FINISHED");
}

// Teams that fail to qualify for the knockout stage: bottom 2 of every
// group, plus whichever 3rd-placed teams miss the best-8 cutoff. Only
// meaningful once isGroupStageComplete(matches) is true — callers should
// check that first, otherwise an empty Set is returned (nobody marked out).
// Third-place teams are ranked by points/GD/GF only (FIFA's actual
// tiebreakers without head-to-head, since these teams never played each
// other) — disciplinary points and ballot are not modelled.
export function getEliminatedTeams(matches) {
  const eliminated = new Set();
  if (!isGroupStageComplete(matches)) return eliminated;

  const thirds = [];
  for (const g of STATIC_GROUPS) {
    const table = calcGroupStandings(g.teams, matches);
    table.slice(2).forEach((entry, i) => {
      if (i === 0) thirds.push(entry); // table[2] = 3rd place
      else eliminated.add(entry.team); // table[3] = 4th place, always out
    });
  }

  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });
  thirds.slice(THIRD_PLACE_QUALIFIERS).forEach(entry => eliminated.add(entry.team));

  return eliminated;
}
