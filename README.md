# 🧼 Sportswash & Go — *115 Problems Edition*

A satirical browser game. As a wealthy, state-backed owner, you buy a club anywhere in the English football pyramid, from the Premier League down to Sunday League Division 6. Then you try to pump in money without getting caught.

**Goal:** turn a club with little financial power into the highest-earning club in the world (top of the "Football Money League") within **10 seasons**.

## v2: real-time edition (in progress)
`v2/` is a faster, replayable take, open at `/v2/` when served. Seasons play out in real time: tap deal bubbles to bank money, shred leaks before they reach the press, and swipe Reigns-style decision cards. Two bars race each other, your Money League climb and the regulator's Case File, and the regulator learns the tricks you reuse. Side missions: The Back Room (a secret meeting that might be a newspaper sting) and star transfers of past-era legends with lightly altered names, where the cheap public fee hides a much bigger real price you have to fund somehow. Arcade beats: chain fair-value deals for a clean-streak multiplier, survive a dawn raid that floods the pitch with leaks when Heat runs too high, and watch big matches play out as a live score ticker where your signed legends get the goals. Runs earn up to three stars, and there's a seeded Daily Fixture with a shareable result. Balance is checked with `node tools/sim-v2.js`.

## The core rule: financial fair play
You can only spend what you **earn**, plus a small allowed loss. Your sovereign fund is effectively unlimited (£600bn). The problem is getting that money into the club in a form the rules count as revenue.

| Money type | Counts as revenue? | FFP risk | Detection risk |
|---|---|---|---|
| Honest equity | ❌ (it's a loss) | Points deduction if over the limit | None |
| Recurring "commercial" deals (state airline, global partners) | ✅ every season | None | Low within fair market value, high above it |
| One-off sales (stadium, hotel, academy players to a sister club) | ✅ that season | None | Medium |
| Off the books (image rights, manager side gigs, envelopes) | ❌ invisible | None | Severe |

## The flywheel
Inflated revenue → bigger squad budget → wins → genuine brand growth → higher **fair market value** → bigger deals you can now justify.

Balance testing over thousands of simulated games:
- **Honest money:** you never top the Money League.
- **Deals at fair value:** you get rich (about 5th in the world) but never richest.
- **Above fair value:** the only way to be No. 1 inside 10 years, and you'll probably end the game under investigation.

Get charged? Hire lawyers. Better lawyers mean longer delays and a better defence, and some charges may become "time-barred".

The **Playbook** (top right) explains how each method works in theory. It shows what regulators look for, real public-record precedent, and a **rattle-risk matrix** for every division.

## Run locally
```bash
python -m http.server 8080   # then open http://localhost:8080 (or: npm start)
npm test                     # node built-in test runner, zero dependencies
```
Opening `index.html` straight from disk won't work: browsers block ES modules on `file://`.

## Contributing
Improvements are welcome. Fork the repo, make your change and open a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for the rules (tests green, no `innerHTML`, keep the satire fictional).

## Deploy
The site is fully static. `.github/workflows/pages.yml` tests it, then publishes it to GitHub Pages on every push to `main`. One-time setup: **Settings → Pages → Source: GitHub Actions**. The repo must be public for free Pages.

## Security
- **No backend, no database, no cookies, no analytics.** Player input never leaves the browser.
- **Strict Content Security Policy:** same-origin scripts and styles only, no inline JS, `connect-src 'none'`, `form-action 'none'`.
- **No `innerHTML` anywhere.** All text is rendered via `textContent`, so names can't inject scripts (XSS).
- **Zero npm dependencies**, so there is no supply-chain attack surface.
- The deploy workflow uses least-privilege permissions and publishes only `index.html`, `css/` and `js/`.

## Disclaimer
Satire. All clubs, states and owners are fictional parodies. References to real events are limited to matters of public record. Where a real club faces allegations, it denies them, and nothing here implies any finding of wrongdoing.

## Licence
[MIT](LICENSE) © 2026 Stuart Mills
