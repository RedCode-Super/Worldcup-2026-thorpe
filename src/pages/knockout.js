import { flag } from "../components/flags.js";
import { normaliseTeamName, findPlayerForTeam } from "../data/sweepstake.js";
import { esc } from "../utils.js";

const ROUND_ORDER = [
  { stage: "ROUND_OF_32",    label: "Round of 32" },
  { stage: "LAST_16",        label: "Round of 16" },
  { stage: "QUARTER_FINALS", label: "Quarter-finals" },
  { stage: "SEMI_FINALS",    label: "Semi-finals" },
  { stage: "THIRD_PLACE",    label: "3rd Place" },
  { stage: "FINAL",          label: "Final" },
];

function winner(match) {
  if (match.status !== "FINISHED") return null;
  const s = match.score?.fullTime ?? {};
  const p = match.score?.penalties ?? {};
  const homeGoals = (s.home ?? 0) + (p.home ?? 0);
  const awayGoals = (s.away ?? 0) + (p.away ?? 0);
  if (homeGoals > awayGoals) return match.homeTeam?.name;
  if (awayGoals > homeGoals) return match.awayTeam?.name;
  return null;
}

function renderBracketTeam(rawName, matchWinner, score) {
  const name = normaliseTeamName(rawName ?? "TBD");
  const isTBD = name === "TBD" || !rawName;
  const isWinner = rawName && matchWinner && normaliseTeamName(matchWinner) === name;
  const owner = isTBD ? null : findPlayerForTeam(name);

  return `
    <div class="bracket-team ${isTBD ? "tbd" : ""} ${isWinner ? "winner" : ""}">
      ${isTBD ? "TBD" : `<span>${flag(name)}</span><span>${esc(name)}</span>${owner ? `<span class="owner-tag" style="font-size:.65rem">${esc(owner)}</span>` : ""}`}
      <span class="bracket-score">${score !== null && score !== undefined ? score : ""}</span>
    </div>`;
}

function renderBracketMatch(match) {
  const w = winner(match);
  const s = match.score?.fullTime ?? {};
  const homeScore = match.status === "FINISHED" ? s.home : null;
  const awayScore = match.status === "FINISHED" ? s.away : null;

  return `
    <div class="bracket-match">
      ${renderBracketTeam(match.homeTeam?.name, w, homeScore)}
      ${renderBracketTeam(match.awayTeam?.name, w, awayScore)}
    </div>`;
}

export function renderKnockoutPage(matches) {
  const knockoutMatches = (matches ?? []).filter(m =>
    ROUND_ORDER.some(r => r.stage === m.stage)
  );

  if (knockoutMatches.length === 0) {
    return `
      <div class="state-msg">
        <h3>Knockout stage not started yet</h3>
        <p>The bracket will appear once the group stage is complete.</p>
      </div>`;
  }

  // Separate 3rd place from the main bracket column layout
  const mainRounds = ROUND_ORDER.filter(r => r.stage !== "THIRD_PLACE");
  const thirdPlace = ROUND_ORDER.find(r => r.stage === "THIRD_PLACE");

  const rounds = mainRounds.map(({ stage, label }) => {
    const roundMatches = knockoutMatches.filter(m => m.stage === stage);
    if (roundMatches.length === 0) return "";
    return `
      <div class="bracket-round">
        <div class="round-label">${label}</div>
        <div class="bracket-col">
          ${roundMatches.map(renderBracketMatch).join("")}
        </div>
      </div>`;
  }).join("");

  const thirdPlaceMatches = knockoutMatches.filter(m => m.stage === "THIRD_PLACE");
  const thirdPlaceHtml = thirdPlaceMatches.length ? `
    <div class="card" style="margin-top:20px">
      <div class="card-header">3rd Place Play-off</div>
      <div style="padding:12px">
        ${thirdPlaceMatches.map(renderBracketMatch).join("")}
      </div>
    </div>` : "";

  return `
    <div class="bracket-scroll">
      <div class="bracket">${rounds}</div>
    </div>
    ${thirdPlaceHtml}`;
}
