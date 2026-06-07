// All times stored as UTC. Browser renders in local time (BST for UK users = UTC+1).
// Channels sourced from live-footballontv.com
const m = (home, away, utcDate, channel) => ({
  homeTeam: { name: home },
  awayTeam: { name: away },
  utcDate,
  status: "SCHEDULED",
  stage: "GROUP_STAGE",
  score: { fullTime: { home: null, away: null } },
  channel,
});

export const STATIC_FIXTURES = [
  // ── Group A ─────────────────────────────────────────────────
  m("Mexico",       "South Africa", "2026-06-11T19:00:00Z", "ITV1/STV"),
  m("South Korea",  "Czechia",      "2026-06-12T02:00:00Z", "ITV1/STV"),
  m("Czechia",      "South Africa", "2026-06-18T16:00:00Z", "BBC One"),
  m("Mexico",       "South Korea",  "2026-06-19T01:00:00Z", "BBC One"),
  m("South Africa", "South Korea",  "2026-06-25T01:00:00Z", "BBC Two"),
  m("Czechia",      "Mexico",       "2026-06-25T01:00:00Z", "BBC One"),

  // ── Group B ─────────────────────────────────────────────────
  m("Canada",         "Bosnia & Herz.", "2026-06-12T19:00:00Z", "BBC One"),
  m("Qatar",          "Switzerland",    "2026-06-13T19:00:00Z", "ITV1/STV"),
  m("Switzerland",    "Bosnia & Herz.", "2026-06-18T19:00:00Z", "ITV1/STV"),
  m("Canada",         "Qatar",          "2026-06-18T22:00:00Z", "ITV1/STV"),
  m("Switzerland",    "Canada",         "2026-06-24T19:00:00Z", "ITV1/STV"),
  m("Bosnia & Herz.", "Qatar",          "2026-06-24T19:00:00Z", "ITV4"),

  // ── Group C ─────────────────────────────────────────────────
  m("Brazil",  "Morocco", "2026-06-13T22:00:00Z", "BBC One"),
  m("Haiti",   "Scotland","2026-06-14T01:00:00Z", "BBC One"),
  m("Scotland","Morocco", "2026-06-19T22:00:00Z", "ITV1/STV"),
  m("Brazil",  "Haiti",   "2026-06-20T01:00:00Z", "ITV1/STV"),
  m("Morocco", "Haiti",   "2026-06-24T22:00:00Z", "BBC Two"),
  m("Scotland","Brazil",  "2026-06-24T22:00:00Z", "BBC One"),

  // ── Group D ─────────────────────────────────────────────────
  m("USA",       "Paraguay",  "2026-06-13T01:00:00Z", "BBC One"),
  m("Australia", "Turkey",    "2026-06-14T04:00:00Z", "ITV1/STV"),
  m("USA",       "Australia", "2026-06-19T19:00:00Z", "BBC One"),
  m("Turkey",    "Paraguay",  "2026-06-20T04:00:00Z", "ITV1/STV"),
  m("Turkey",    "USA",       "2026-06-26T02:00:00Z", "ITV1/STV"),
  m("Paraguay",  "Australia", "2026-06-26T02:00:00Z", "ITV4"),

  // ── Group E ─────────────────────────────────────────────────
  m("Germany",     "Curaçao",     "2026-06-14T17:00:00Z", "ITV1/STV"),
  m("Ivory Coast", "Ecuador",     "2026-06-14T23:00:00Z", "BBC One"),
  m("Germany",     "Ivory Coast", "2026-06-20T20:00:00Z", "ITV1/STV"),
  m("Ecuador",     "Curaçao",     "2026-06-21T00:00:00Z", "BBC One"),
  m("Curaçao",     "Ivory Coast", "2026-06-25T20:00:00Z", "BBC Two"),
  m("Ecuador",     "Germany",     "2026-06-25T20:00:00Z", "BBC One"),

  // ── Group F ─────────────────────────────────────────────────
  m("Netherlands", "Japan",       "2026-06-14T20:00:00Z", "ITV1/STV"),
  m("Sweden",      "Tunisia",     "2026-06-15T02:00:00Z", "ITV1/STV"),
  m("Netherlands", "Sweden",      "2026-06-20T17:00:00Z", "BBC One"),
  m("Tunisia",     "Japan",       "2026-06-21T04:00:00Z", "BBC One"),
  m("Tunisia",     "Netherlands", "2026-06-25T23:00:00Z", "BBC One"),
  m("Japan",       "Sweden",      "2026-06-25T23:00:00Z", "BBC Two"),

  // ── Group G ─────────────────────────────────────────────────
  m("Belgium",     "Egypt",       "2026-06-15T19:00:00Z", "BBC One"),
  m("Iran",        "New Zealand", "2026-06-16T01:00:00Z", "BBC One"),
  m("Belgium",     "Iran",        "2026-06-21T19:00:00Z", "ITV1/STV"),
  m("New Zealand", "Egypt",       "2026-06-22T01:00:00Z", "ITV1/STV"),
  m("New Zealand", "Belgium",     "2026-06-27T03:00:00Z", "BBC One"),
  m("Egypt",       "Iran",        "2026-06-27T03:00:00Z", "BBC Two"),

  // ── Group H ─────────────────────────────────────────────────
  m("Spain",        "Cape Verde",  "2026-06-15T16:00:00Z", "ITV1/STV"),
  m("Saudi Arabia", "Uruguay",     "2026-06-15T22:00:00Z", "ITV1/STV"),
  m("Spain",        "Saudi Arabia","2026-06-21T16:00:00Z", "BBC One"),
  m("Uruguay",      "Cape Verde",  "2026-06-21T22:00:00Z", "BBC One"),
  m("Cape Verde",   "Saudi Arabia","2026-06-27T00:00:00Z", "ITV4"),
  m("Uruguay",      "Spain",       "2026-06-27T00:00:00Z", "ITV1/STV"),

  // ── Group I ─────────────────────────────────────────────────
  m("France",  "Senegal", "2026-06-16T19:00:00Z", "BBC One"),
  m("Iraq",    "Norway",  "2026-06-16T22:00:00Z", "BBC One"),
  m("France",  "Iraq",    "2026-06-22T21:00:00Z", "BBC One"),
  m("Norway",  "Senegal", "2026-06-23T00:00:00Z", "ITV1/STV"),
  m("Norway",  "France",  "2026-06-26T19:00:00Z", "ITV1/STV"),
  m("Senegal", "Iraq",    "2026-06-26T19:00:00Z", "ITV4"),

  // ── Group J ─────────────────────────────────────────────────
  m("Argentina", "Algeria",  "2026-06-17T01:00:00Z", "ITV1/STV"),
  m("Austria",   "Jordan",   "2026-06-17T04:00:00Z", "BBC One"),
  m("Argentina", "Austria",  "2026-06-22T17:00:00Z", "BBC One"),
  m("Jordan",    "Algeria",  "2026-06-23T03:00:00Z", "ITV1/STV"),
  m("Algeria",   "Austria",  "2026-06-28T02:00:00Z", "BBC Two"),
  m("Jordan",    "Argentina","2026-06-28T02:00:00Z", "BBC One"),

  // ── Group K ─────────────────────────────────────────────────
  m("Portugal",  "DR Congo",   "2026-06-17T17:00:00Z", "BBC One"),
  m("Uzbekistan","Colombia",   "2026-06-18T02:00:00Z", "BBC One"),
  m("Portugal",  "Uzbekistan", "2026-06-23T17:00:00Z", "ITV1/STV"),
  m("Colombia",  "DR Congo",   "2026-06-24T02:00:00Z", "ITV1/STV"),
  m("Colombia",  "Portugal",   "2026-06-27T23:30:00Z", "BBC One"),
  m("DR Congo",  "Uzbekistan", "2026-06-27T23:30:00Z", "BBC Two"),

  // ── Group L ─────────────────────────────────────────────────
  m("England", "Croatia", "2026-06-17T20:00:00Z", "ITV1/STV"),
  m("Ghana",   "Panama",  "2026-06-17T23:00:00Z", "ITV1/STV"),
  m("England", "Ghana",   "2026-06-23T20:00:00Z", "BBC One"),
  m("Panama",  "Croatia", "2026-06-23T23:00:00Z", "BBC One"),
  m("Panama",  "England", "2026-06-27T21:00:00Z", "ITV1/STV"),
  m("Croatia", "Ghana",   "2026-06-27T21:00:00Z", "ITV4"),
];
