import { init, subscribe, forceRefresh } from "./data/store.js";
import { esc } from "./utils.js";
import { renderGroupsPage }     from "./pages/groups.js";
import { renderFixturesPage, resetFixturesFilter } from "./pages/fixtures.js";
import { renderKnockoutPage }   from "./pages/knockout.js";
import { renderSweepstakePage } from "./pages/sweepstake.js";
import { renderTvPage, resetTvFilter } from "./pages/tv.js";

const TABS = ["groups", "fixtures", "knockout", "sweepstake"];

let _activeTab = "sweepstake";
let _state     = { matches: null, error: null, loading: true };

// ── DOM refs ────────────────────────────────────────────────────
const mainEl        = document.getElementById("content");
const errorBannerEl = document.getElementById("errorBanner");
const navBtns       = document.querySelectorAll("nav [data-tab]");
const refreshBtn    = document.getElementById("refreshBtn");
const lastUpdatedEl = document.getElementById("lastUpdated");
const themeBtn      = document.getElementById("themeBtn");

// ── Theme ────────────────────────────────────────────────────
function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  if (themeBtn) themeBtn.textContent = dark ? "☀" : "🌙";
  localStorage.setItem("wc_theme", dark ? "dark" : "light");
}
const _savedTheme = localStorage.getItem("wc_theme");
const _systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(_savedTheme ? _savedTheme === "dark" : _systemDark);
themeBtn?.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme !== "dark");
});

// ── Tab switching ────────────────────────────────────────────────
function setTab(tab) {
  _activeTab = tab;
  navBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  renderCurrentTab();
}

navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.tab !== "fixtures") resetFixturesFilter();
    if (btn.dataset.tab !== "tv") resetTvFilter();
    setTab(btn.dataset.tab);
  });
});

refreshBtn?.addEventListener("click", () => {
  forceRefresh();
});

// ── Rendering ────────────────────────────────────────────────────
function loadingHtml() {
  return `<div class="state-msg"><div class="spinner"></div><p>Loading match data…</p></div>`;
}

// Every tab renders from the static schedule when live data is missing, so
// an error never blocks a tab — it shows as a banner above the content.
function errorBannerHtml(err) {
  const friendly = err === "matches_not_found"
    ? "Match data hasn't been published yet — the score-fetch workflow may not have run."
    : "Couldn't load live scores — showing the schedule without results. Try ↻ Refresh.";
  return `
    <div class="error-banner">
      <span>⚠️ ${friendly}</span>
      <span class="error-detail">${esc(err)}</span>
    </div>`;
}

function renderCurrentTab() {
  const { matches, error, loading } = _state;

  if (errorBannerEl) errorBannerEl.innerHTML = (!loading && error) ? errorBannerHtml(error) : "";
  if (loading) { mainEl.innerHTML = loadingHtml(); return; }

  switch (_activeTab) {
    case "sweepstake":
      mainEl.innerHTML = renderSweepstakePage(matches);
      break;
    case "groups":
      mainEl.innerHTML = renderGroupsPage(matches);
      break;
    case "fixtures":
      renderFixturesPage(matches, mainEl);
      break;
    case "tv":
      renderTvPage(matches, mainEl);
      break;
    case "knockout":
      mainEl.innerHTML = renderKnockoutPage(matches);
      break;
  }
}

function updateLastUpdated(fetchedAt) {
  if (!fetchedAt || !lastUpdatedEl) return;
  const d = new Date(fetchedAt);
  lastUpdatedEl.textContent = "Updated " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  lastUpdatedEl.className = "last-updated";
}

// ── Store subscription ───────────────────────────────────────────
subscribe(state => {
  _state = state;
  updateLastUpdated(state.fetchedAt);
  renderCurrentTab();
});

// ── Boot ─────────────────────────────────────────────────────────
setTab(_activeTab);
init();
