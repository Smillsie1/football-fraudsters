import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIVISIONS, CLUBS, METHODS, BREACH_VECTORS, RESPONSES, OBSTRUCTIONS } from '../js/data.js';
import {
  newGame, previewSeason, playSeason, hireLawyers, methodSuspicion, rattleRating, methodCap, genuineRevenue, defaultAlloc,
  resolveBreach, breachChance, projectedSecurity, exposure, securityMax,
  applyObstruction, previewObstruction,
  formatMoney, divisionByTier, finalScore, endingTitle, SEASONS,
} from '../js/engine.js';

// Deterministic RNG (mulberry32) so outcomes are repeatable.
function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const base = { owner: 'Test', title: 'Their Excellency', state: 'Offshoria', holdco: 'X LLP' };
const zero = () => Object.fromEntries(METHODS.map((m) => [m.id, 0]));

test('every division has clubs', () => {
  for (const d of DIVISIONS) assert.ok(CLUBS[d.id]?.length >= 3, d.id);
});

test('formatMoney covers bn, m, k', () => {
  assert.equal(formatMoney(2500), '£2.5bn');
  assert.equal(formatMoney(35), '£35m');
  assert.equal(formatMoney(0.15), '£150k');
});

test('equity is invisible to regulators but counts as an FFP loss', () => {
  const g = newGame({ ...base, divisionId: 'prem', clubIndex: 0 });
  const p = previewSeason(g, { ...zero(), equity: 50 });
  assert.equal(p.addedSuspicion, 0);
  assert.equal(p.rollingLoss, 50);
});

test('related-party deals raise reported revenue and squad budget without FFP loss', () => {
  const g = newGame({ ...base, divisionId: 'prem', clubIndex: 5 });
  const plain = previewSeason(g, zero());
  const sponsored = previewSeason(g, { ...zero(), sponsor: 100 });
  assert.equal(sponsored.booked - plain.booked, 100);
  assert.ok(sponsored.squadSpend > plain.squadSpend);
  assert.equal(sponsored.rollingLoss, 0);
});

test('recurring deals carry over to the next season', () => {
  let g = newGame({ ...base, divisionId: 'champ', clubIndex: 0 });
  g = playSeason(g, { ...zero(), sponsor: 20 }, seeded(4)).game;
  assert.equal(defaultAlloc(g).sponsor, 20);
});

test('winning grows genuine revenue, which raises fair market value', () => {
  const g = newGame({ ...base, divisionId: 'prem', clubIndex: 0 });
  const sponsor = METHODS.find((m) => m.id === 'sponsor');
  const before = methodCap(sponsor, g);
  const bigger = { ...g, brand: 2 };
  assert.ok(methodCap(sponsor, bigger) > before);
  assert.ok(genuineRevenue(bigger) > genuineRevenue(g));
});

test('fair-value deals cannot top the Money League from a small club in season 1', () => {
  const g = newGame({ ...base, divisionId: 'prem', clubIndex: 5 });
  const a = zero();
  for (const m of METHODS) if (m.kind === 'recurring') a[m.id] = methodCap(m, g);
  assert.ok(previewSeason(g, a).league.rank > 1);
});

test('breaking the prem loss limit triggers an automatic deduction', () => {
  const g = newGame({ ...base, divisionId: 'prem', clubIndex: 0 });
  const { report } = playSeason(g, { ...zero(), equity: 200 }, seeded(1));
  assert.ok(report.pointsDeducted >= 10);
});

test('lower leagues have no loss limit', () => {
  const g = newGame({ ...base, divisionId: 'sunday', clubIndex: 0 });
  assert.equal(previewSeason(g, { ...zero(), equity: 0.2 }).breachesLossLimit, false);
});

test('over-cap injections are more suspicious than within-cap', () => {
  const g = newGame({ ...base, divisionId: 'prem', clubIndex: 5 });
  const m = METHODS.find((x) => x.id === 'sponsor');
  const per = (amt) => methodSuspicion(m, amt, g) / amt;
  assert.ok(per(400) > per(20));
});

test('premier league rattles harder than sunday league', () => {
  const m = METHODS.find((x) => x.id === 'imagerights');
  assert.ok(rattleRating(m, divisionByTier(1)).level > rattleRating(m, divisionByTier(8)).level);
});

test('stadium can only be sold once', () => {
  let g = newGame({ ...base, divisionId: 'l1', clubIndex: 0 });
  g = playSeason(g, { ...zero(), stadium: 5 }, seeded(2)).game;
  assert.equal(g.stadiumSold, true);
  assert.equal(previewSeason(g, { ...zero(), stadium: 5 }).oneoff, 0);
});

test('playSeason does not mutate input', () => {
  const g = newGame({ ...base, divisionId: 'champ', clubIndex: 0 });
  const snapshot = JSON.stringify(g);
  playSeason(g, { ...zero(), briefcase: 50 }, seeded(3));
  assert.equal(JSON.stringify(g), snapshot);
});

test('security spend raises posture and cuts breach chance', () => {
  const g = newGame({ ...base, divisionId: 'prem', clubIndex: 0 });
  const low = projectedSecurity(g, 0);
  const high = projectedSecurity(g, securityMax(divisionByTier(g.tier)));
  assert.ok(high > low);
  assert.ok(breachChance(high) < breachChance(low));
});

test('exposure is zero for a clean club and high for a fake one', () => {
  const g = newGame({ ...base, divisionId: 'prem', clubIndex: 5 });
  assert.equal(previewSeason(g, { ...zero(), equity: 10 }).exposure, 0);
  assert.ok(previewSeason(g, { ...zero(), sponsor: 500, imagerights: 200 }).exposure > 0.5);
});

test('security budget counts towards the loss limit', () => {
  const g = newGame({ ...base, divisionId: 'prem', clubIndex: 0 });
  assert.equal(previewSeason(g, { ...zero(), security: 20 }).rollingLoss, 20);
});

test('a leak at a dirty club adds far more suspicion than at a clean one', () => {
  const rng = () => 0.9; // force a sizeable leak deterministically
  const mk = (alloc) => { let g = newGame({ ...base, divisionId: 'prem', clubIndex: 5 });
    const r = playSeason(g, alloc, rng); g = r.game; g.history[g.history.length-1].breach = { vectorId: 'insider', resolved: false };
    return resolveBreach(g, 'nothing', rng).outcome.added; };
  const clean = mk({ ...zero(), equity: 5 });
  const dirty = mk({ ...zero(), sponsor: 400, imagerights: 150 });
  assert.ok(dirty > clean + 10, `dirty ${dirty} vs clean ${clean}`);
});

test('covering up can backfire and leak anyway', () => {
  let g = newGame({ ...base, divisionId: 'prem', clubIndex: 5 });
  g = playSeason(g, { ...zero(), sponsor: 300 }, () => 0.5).game;
  g.history[g.history.length-1].breach = { vectorId: 'phish', resolved: false };
  // rng=0.1 < 0.4 triggers the backfire branch
  const out = resolveBreach(g, 'coverup', () => 0.1).outcome;
  assert.equal(out.backfired, true);
});

test('every vector and response is well-formed', () => {
  for (const v of BREACH_VECTORS) { assert.ok(v.severity > 0 && v.severity <= 1); assert.ok(v.lesson); }
  for (const r of RESPONSES) assert.ok(r.containment > 0 && r.containment <= 1);
});

test('obstruction raises cover level and costs money', () => {
  const g = newGame({ ...base, divisionId: 'prem', clubIndex: 0 });
  const g2 = applyObstruction(g, ['flatten', 'slow']);
  assert.ok(g2.coverLevel > 0);
  assert.ok(g2.fundSpent > g.fundSpent);
  assert.equal(g2.obstructionUsed, true);
});

test('cover level decays when you cooperate', () => {
  let g = applyObstruction(newGame({ ...base, divisionId: 'prem', clubIndex: 0 }), ['jurisdiction', 'vanish']);
  const before = g.coverLevel;
  g = applyObstruction(g, []); // deploy nothing
  assert.ok(g.coverLevel < before);
});

test('obstruction reduces how many charges stick', () => {
  const rng = () => 0.0; // force an investigation and small random draws
  const mk = (cover) => { let g = newGame({ ...base, divisionId: 'prem', clubIndex: 0 });
    g.suspicion = 80; g.coverLevel = cover;
    return playSeason(g, zero(), rng).report.newCase?.charges ?? 0; };
  assert.ok(mk(0) > mk(80));
});

test('obstruction extends the delay before a verdict', () => {
  let g = newGame({ ...base, divisionId: 'prem', clubIndex: 0 });
  g.suspicion = 90; g.coverLevel = 80;
  g = playSeason(g, zero(), () => 0.0).game;
  g = hireLawyers(g, 'cousin'); // 1-season base delay
  const c = g.cases[g.cases.length - 1];
  assert.ok(c.verdictSeason - c.seasonCharged > 1);
});

test('every obstruction tactic is well-formed', () => {
  for (const o of OBSTRUCTIONS) { assert.ok(o.coverGain > 0); assert.ok(o.real && o.blurb); }
});

test('a full game always terminates with a valid ending', () => {
  for (let seed = 0; seed < 200; seed++) {
    const rng = seeded(seed);
    const div = DIVISIONS[seed % DIVISIONS.length];
    let g = newGame({ ...base, divisionId: div.id, clubIndex: 0 });
    let guard = 0;
    while (!g.over && guard++ < 20) {
      const d = divisionByTier(g.tier);
      const alloc = Object.fromEntries(METHODS.map((m) => [m.id, rng() * d.scale * 10]));
      alloc.equity = Math.min(alloc.equity, Number.isFinite(d.lossLimit) ? d.lossLimit : alloc.equity);
      const res = playSeason(g, alloc, rng);
      g = res.game;
      if (!g.over) g = applyObstruction(g, seed % 2 ? ['slow'] : []);
      if (res.report.breach && !res.report.breach.resolved) g = resolveBreach(g, ['isolate','forensics','coverup','nothing'][seed % 4], rng).game;
      if (res.report.newCase) g = hireLawyers(g, ['cousin', 'firm', 'everyone'][seed % 3]);
    }
    assert.ok(g.over, `seed ${seed} did not finish`);
    assert.equal(g.history.length, SEASONS);
    assert.ok(g.tier >= 1 && g.tier <= DIVISIONS.length);
    assert.equal(typeof endingTitle(g).title, 'string');
    assert.ok(Number.isFinite(finalScore(g)));
  }
});
