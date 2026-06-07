# World Cup 2026 — Sweepstake App

Group standings, fixtures, knockout bracket, and sweepstake tracker for the 2026 FIFA World Cup.

## Setup

### 1. Get a free API key
Sign up at https://www.football-data.org/client/register (free, takes 1 minute).

### 2. Add the key to GitHub Actions
Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
- Name: `FOOTBALL_API_KEY`
- Value: your key

### 3. Enable GitHub Pages
Repo → **Settings → Pages → Branch: main → / (root) → Save**

### 4. Trigger the first data fetch
Repo → **Actions → Fetch World Cup Data → Run workflow**

Data then auto-updates every 45 minutes (well within the 100 req/day free tier limit).

## Sweepstake
| Player | Teams |
|---|---|
| Durham | Mexico, Uruguay, Egypt, Haiti, Germany, Ghana |
| Bridgey | Portugal, Morocco, Tunisia, Sweden, Colombia, Jordan |
| Thorpey | USA, Ecuador, Côte d'Ivoire, New Zealand, France, Cape Verde |
| Niko | England, Australia, Norway, Iraq, Brazil, Saudi Arabia |
| Rozza | Belgium, Japan, Paraguay, Czech Republic, IR Iran, Uzbekistan |
| Jenko | Netherlands, Austria, South Africa, Türkiye, Senegal, Algeria |
| Bevers | Argentina, Switzerland, Panama, Bosnia-Herzegovina, Korea Republic, Scotland |
| Foxy | Canada, Croatia, Qatar, DR Congo, Spain, Curaçao |
