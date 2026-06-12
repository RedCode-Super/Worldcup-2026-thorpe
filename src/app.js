import { init, subscribe, forceRefresh } from "./data/store.js";
import { renderGroupsPage }     from "./pages/groups.js";
import { renderFixturesPage, resetFixturesFilter } from "./pages/fixtures.js";
import { renderKnockoutPage }   from "./pages/knockout.js";
import { renderSweepstakePage } from "./pages/sweepstake.js";
import { renderTvPage, resetTvFilter } from "./pages/tv.js";

const TABS = ["groups", "fixtures", "knockout", "sweepstake"];

let _activeTab = "sweepstake";
let _state     = { standings: null, matches: null, error: null, loading: true };

// ── DOM refs ────────────────────────────────────────────────────
const mainEl        = document.getElementById("content");
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

function errorHtml(err) {
  if (err === "standings_not_found" || err === "matches_not_found") {
    return `
      <div class="state-msg">
        <h3>Data not available yet</h3>
        <p>The GitHub Actions workflow hasn't run yet. Go to your repo → Actions → <strong>Fetch World Cup Data</strong> → Run workflow to fetch data for the first time.</p>
      </div>`;
  }
  if (err.startsWith("api_error:403")) {
    return `
      <div class="state-msg">
        <h3>API subscription required</h3>
        <p>Your football-data.org plan doesn't include World Cup 2026 data yet. Check your subscription at football-data.org. The Sweepstake tab still works!</p>
      </div>`;
  }
  return `
    <div class="state-msg">
      <h3>Something went wrong</h3>
      <p>${err}</p>
    </div>`;
}

function renderCurrentTab() {
  const { standings, matches, error, loading } = _state;

  if (loading) { mainEl.innerHTML = loadingHtml(); return; }

  // Groups and Sweepstake have hardcoded fallback data — render regardless of API state
  if (_activeTab === "sweepstake") {
    mainEl.innerHTML = renderSweepstakePage(matches, standings);
    return;
  }
  if (_activeTab === "groups") {
    mainEl.innerHTML = renderGroupsPage(standings, matches);
    return;
  }
  if (_activeTab === "fixtures") {
    renderFixturesPage(matches, mainEl);
    return;
  }
  if (_activeTab === "tv") {
    renderTvPage(matches, mainEl);
    return;
  }

  if (error) { mainEl.innerHTML = errorHtml(error); return; }

  switch (_activeTab) {
    case "groups":
      mainEl.innerHTML = renderGroupsPage(standings, matches);
      break;
    case "fixtures":
      renderFixturesPage(matches, mainEl);
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
