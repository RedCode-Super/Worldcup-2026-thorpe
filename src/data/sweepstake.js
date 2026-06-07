export const SWEEPSTAKE = [
  { player: "Lee",     teams: ["France", "Ivory Coast", "Sweden"] },
  { player: "Tony",    teams: ["Portugal", "Saudi Arabia", "Iraq"] },
  { player: "Martina", teams: ["England", "Iran", "Curaçao"] },
  { player: "Ang",     teams: ["USA", "Ecuador", "Bosnia & Herz."] },
  { player: "Joe",     teams: ["Spain", "Senegal", "Haiti"] },
  { player: "Kerri",   teams: ["Mexico", "Switzerland", "Turkey"] },
  { player: "Carol",   teams: ["Croatia", "Australia", "Czechia"] },
  { player: "James B", teams: ["Morocco", "Egypt", "DR Congo"] },
  { player: "Sam G",   teams: ["Germany", "Algeria", "Ghana"] },
  { player: "Steve P", teams: ["Brazil", "Paraguay", "Jordan"] },
  { player: "Kate",    teams: ["Netherlands", "Scotland", "Cape Verde"] },
  { player: "Paul",    teams: ["Colombia", "Japan", "South Africa"] },
  { player: "Sarah",   teams: ["Uruguay", "Tunisia", "Uzbekistan"] },
  { player: "Stewart", teams: ["Argentina", "South Korea", "Qatar"] },
  { player: "Andy",    teams: ["Belgium", "Austria", "Panama"] },
  { player: "Josh",    teams: ["Canada", "Norway", "New Zealand"] },
];

// Map API team names → display names (API uses official FIFA names)
export const TEAM_ALIASES = {
  "United States": "USA",
  "United States of America": "USA",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  "Côte D'Ivoire": "Ivory Coast",
  "IR Iran": "Iran",
  "Türkiye": "Turkey",
  "Bosnia and Herzegovina": "Bosnia & Herz.",
  "Bosnia-Herzegovina": "Bosnia & Herz.",
  "Republic of Korea": "South Korea",
  "Korea Republic": "South Korea",
  "Czech Republic": "Czechia",
  "Congo DR": "DR Congo",
  "Democratic Republic of Congo": "DR Congo",
};

export function normaliseTeamName(name) {
  return TEAM_ALIASES[name] ?? name;
}

export function findPlayerForTeam(teamName) {
  const normalised = normaliseTeamName(teamName);
  return SWEEPSTAKE.find(s => s.teams.includes(normalised))?.player ?? null;
}
