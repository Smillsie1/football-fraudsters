# Contributing to Sportswash & Go

Thanks for helping make the game better. New missions, balance tweaks, bug fixes
and accessibility improvements are all welcome.

## How to contribute
1. **Fork** this repo and create a branch for your change.
2. Make your change and run the tests (below).
3. Open a **pull request** against `main` describing what you changed and why.
4. CI runs the tests on your PR. Once it's green and reviewed, it gets merged.

For bigger ideas (a new mechanic or mission), open an issue first so we can agree
the shape before you build it.

## Run locally
The game is a static site with zero dependencies. ES modules don't load from
`file://`, so serve the folder rather than opening `index.html` directly:

```bash
python -m http.server 8080   # then open http://localhost:8080
npm test                     # Node's built-in test runner (Node 22+)
```

## Where things live
- `js/data.js`: all content and tuning numbers. Start here for balance changes.
- `js/engine.js`: pure game logic with no DOM. Every function takes an injectable
  `rng`, so it's fully unit-testable.
- `js/app.js`: UI only. All DOM is built with the `h()` helper.
- `css/style.css`: styles, light/dark via `prefers-color-scheme`.
- `tests/engine.test.js`: tests, using a seeded RNG for determinism.

## Rules for every change
- **Keep `npm test` green.** New engine logic needs tests.
- **Never use `innerHTML`** (or `outerHTML`, `insertAdjacentHTML`, `eval`). Build
  DOM with `h()`, which sets text via `textContent`.
- **Don't weaken the Content Security Policy** in `index.html`: no inline scripts
  or styles, no third-party scripts, fonts, analytics or network calls.
- **No npm dependencies.** The zero-dependency setup is deliberate.
- New mechanics follow the existing pattern: data in `data.js`, logic and tests in
  `engine.js`, then UI wiring (preview line, season-screen card, Playbook entry,
  status/summary lines).
- If you change balance, sanity-check it with a quick simulation loop over a few
  hundred games per strategy. The design rule is: *cheating hard is usually
  punished, caution isn't.*

## Satire guidelines
- All clubs, states, owners and people stay **fictional parodies**. No real crests,
  logos or branding.
- Real events may be referenced only as **matters of public record**. Where a real
  club faces allegations, note that they are denied, and imply no finding of
  wrongdoing.
- Punch at systems and regulation, not at individuals.

## Licence
By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
