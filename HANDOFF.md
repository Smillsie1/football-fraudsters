# Handoff — Football Fraudsters ("Sportswash & Go")

Last updated: 2026-10-05. This file is the pickup point for a new agent/developer
continuing the project locally. Read it first.

> Note: the game is titled **Sportswash & Go** in the UI; the **repo** is
> `Smillsie1/football-fraudsters`. Both names are intentional. Default branch is
> **`main`** and that's where everything lives.

## What this is
A satirical, single-page browser game. You buy a (parody) football club anywhere
in the English pyramid and, as a state-backed owner bound by financial fair play
(FFP), try to make illegitimate money look legitimate and climb to the top of a
"Money League" within 10 seasons — while juggling several real-world-inspired
scandals. **It is satire**: all clubs, states and people are fictional; real
events are referenced only as matters of public record.

## Tech at a glance
- **Pure static site.** No backend, no database, no build step, **zero npm dependencies**.
- Plain ES modules in the browser. `index.html` loads `js/app.js` as `type="module"`.
- Tests run on Node's built-in runner (`node --test`), no test framework.
- **Security posture (keep this intact):**
  - Strict CSP in `index.html`: `default-src 'none'`, `script-src 'self'`,
    `style-src 'self'`, `connect-src 'none'`, `form-action 'none'`. No inline JS.
  - **Never use `innerHTML`.** All DOM is built via the `h()` helper in `app.js`,
    which creates elements and sets text via `textContent` (XSS-safe). User input
    (owner name etc.) is also length-capped and control-char-stripped via `clean()`.
  - No third-party scripts/fonts/analytics. Player input never leaves the browser.

## Run & test
```bash
npm test     # node --test tests/*.test.js  (expect 37 passing)
npm start    # python3 -m http.server 8080 -> open http://localhost:8080
```
There is no bundler; just open the served page. ES modules require http(s)
(not file://), so use the server.

## File map
- `index.html` — shell, CSP, `<dialog>` for the Playbook, satire disclaimer.
- `js/data.js` — **all content/config as data** (divisions, clubs, money methods,
  the side-mission configs, rivals, explainer text). Tune numbers here first.
- `js/engine.js` — **pure game logic, no DOM**. All of it is unit-testable and
  takes an injectable `rng` (defaults to `Math.random`) so tests are deterministic.
- `js/app.js` — **UI only**. Screen functions + the `h()` helper. No game maths here.
- `css/style.css` — light/dark via `prefers-color-scheme`, mobile-first, tokens on `:root`.
- `tests/engine.test.js` — 37 tests. Uses a seeded mulberry32 RNG for determinism.
- `.github/workflows/pages.yml` — tests then deploys to GitHub Pages (see Deploy).
- `README.md` — player-facing overview.

## Core model (engine.js)
- `booked revenue = genuine + recurring related-party deals + one-off sales`
- `squad spend = 70% of booked revenue + owner equity + off-book pay + EBT pay`
- `FFP loss = owner equity + security spend` (the only spend FFP counts)
- **Genuine revenue** grows only from on-pitch success (`brand`), which also raises
  the **fair-market-value cap** on related-party deals. That's the intended
  "flywheel": inflate revenue -> spend -> win -> brand grows -> bigger deals justified.
- Key tunables in `data.js`: `SEASONS` (10), `FUND` (£600bn), per-division `scale`,
  `scrutiny`, `lossLimit`, `baseRevenue`, `ptsPenalty`.

## Game systems (all implemented & tested)
**Ways to get money in** (`METHODS` in data.js; `kind` drives behaviour):
- `equity` (honest, invisible to regulator but an FFP loss)
- `recurring` — State Airline shirt deal, Mysterious Global Partners (booked every season)
- `oneoff` — sell stadium/hotel/mascot to yourself, multi-club transfers, **TPO** (banned)
- `offbook` — image rights, manager side gig, **agent bungs**, brown envelope
- `ebt` (the EBT scheme — see below; its own kind)

**Enforcers / consequence systems:**
- **Football regulator** — suspicion builds from disguised money; an investigation
  opens a case; you hire lawyers (delay vs defence); verdict = fine/points/expulsion.
  Over-fair-value deals and off-book pay are the suspicious ones.
- **HMRC (the taxman)** — the EBT scheme routes wages via an offshore trust:
  cheap squad strength, invisible to football, but builds `taxExposure`. HMRC opens
  a separate, slow case; you **settle** (certain, reduced bill) or **fight** (long
  delay, slim escape, but losing an unpayable bill = **liquidation** → crash down
  divisions). Based on the Rangers Big Tax Case.
- **FIFA embargo** — using banned TPO risks a transfer embargo (squad strength hit).
- **Integrity unit (match-fixing)** — the referee mission (below).

**Cover / defensive missions:**
- **Cyber security** — per-season budget raises `security`; random breaches
  (`resolveBreach`); a leak's suspicion hit scales with how fake your accounts are
  (Football Leaks parody). Threat vectors named at awareness level only.
- **Obstruction** — after each season, deploy delaying tactics (`applyObstruction`):
  fewer charges stick + longer verdict delays (time-barring), but standing suspicion
  + non-cooperation risk.
- **Amortisation** — a per-season toggle deferring FFP losses; a retroactive rule
  change can claw them all back at once (Chelsea 2023 / UEFA 5-year cap).
- **Referee influence ("Nobble the officials")** — spend on "unconnected" referee
  hospitality to build hidden `refInfluence`, worth a few league places via
  favourable decisions; raises suspicion every season; a proven match-fixing
  scandal strips a title + expels you (the **Calciopoli** ending). Based on
  Calciopoli 2006 and the 2005 Hoyzer case.

Everything that needs a player decision (hire lawyers, respond to a breach, settle
vs fight HMRC) blocks the season-end in `playSeason` via report flags
(`newCase` / `breach` / `newHmrc`) and is resolved by a matching `resolve*` /
`hire*` function, then the report screen re-renders.

## Balance
Tuned via throwaway simulation scripts (not committed; they lived in a scratch dir
and just import `js/engine.js` and loop `playSeason`). Findings baked in:
- Honest money never tops the Money League; fair-value deals get ~top-5; going
  above fair value is the only route to #1 in 10 years and usually ends under
  investigation.
- EBT abuse without the genuine revenue to back it can liquidate you (reachable in
  lower leagues especially). Settling early is survivable.
- Heavy referee use wins titles but trends toward the Calciopoli ending.
If you retune, re-run a sim loop over ~300 games/strategy and keep "cheating hard
is usually punished, caution isn't."

## Conventions (please keep)
- Work on `main`. Keep `npm test` green before every push (CI runs it too).
- Content/numbers go in `data.js`; logic in `engine.js` (pure, rng-injectable);
  DOM in `app.js` via `h()` only — **no `innerHTML`, ever**.
- New mechanics: add data + engine function + tests, then wire UI. Mirror the
  existing side-mission pattern (preview line, season-screen card, Playbook entry,
  status-bar/summary lines).
- Keep the satire disclaimer and the "real events = public record, allegations
  denied" framing. Parody names only; no real club crests/branding.

## Deploy status — ACTION NEEDED (not a code problem)
The site is static; `.github/workflows/pages.yml` tests then publishes to GitHub
Pages on push to `main`. **The deploy currently fails at the "enable Pages" step.**
Root cause, confirmed from the Actions logs:
1. The repo is **private** — free Pages (and public play) needs it **public**.
2. **Pages isn't enabled**, and the Actions token isn't permitted to enable it
   itself (`Resource not accessible by integration`) — this is intentional GitHub
   least-privilege; a human must do it once.

**To go live on GitHub Pages:** Settings → General → make repo **public**; then
Settings → Pages → Source → **GitHub Actions**; then re-run the latest workflow
(or push). It'll then serve at `https://smillsie1.github.io/football-fraudsters/`.

**Alternative hosts (all work, it's just static files):**
- Cloudflare Pages / Netlify — drag the built folder, instant HTTPS (easiest).
- S3 + CloudFront — HTTPS + CDN; keep the bucket private, serve via Origin Access
  Control (least privilege). Note: the "copy brag text" button uses the clipboard
  API, which needs HTTPS, so prefer CloudFront over plain-http S3.
- Build the deployable folder locally with: `mkdir -p _site && cp -r index.html css js _site/`
  (that's exactly what the workflow publishes — tests + public files only, never
  `tests/`, `package.json`, or this file).

## Open ideas / possible next steps (not started)
- Hosting is the main open item (above).
- Possible further real-event missions discussed but not built: sanctioned-owner /
  source-of-funds forced sale (Abramovich 2022), ghost/circular sponsorships.
- Persistence (localStorage) for resuming a game — currently in-memory only
  (would need a CSP/`try-catch` wrapper per the storage caveats).
- Shareable result links.

## Git / attribution
Commits in this project use:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01HZQhpc4JYHDSTirG9sA2i8
```
Do not put any model identifier in code/README/PR text — chat only.
