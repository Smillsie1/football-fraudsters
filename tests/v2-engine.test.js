import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, WEEKS, SEASON_SECONDS, MAX_CHARGES, DEAL_TERM, CARDS, METHODS } from '../v2/js/data.js';
import {
  newRun, tick, collect, shred, topUp, choose, nextSeason, mulberry32, dailySeed,
  bookedRevenue, strength, strengthFromSpend, methodHeatMult, moneyRank, leagueTable,
  ffpHeadroom, topUpAmount, stars, shareText, division,
} from '../v2/js/engine.js';

const fresh = (seed = 42) => {
  const rng = mulberry32(seed);
  return { s: newRun({ clubName: 'Test FC', seed }, rng), rng };
};
const addDeal = (s, methodId, infl = 1, value = 10) => {
  const b = { id: s.nextId++, type: 'deal', methodId, infl, value, x: 0.5, y: 0.5, life: 5, maxLife: 5 };
  s.bubbles.push(b);
  return b;
};
const addLeak = (s, x = 0.5) => {
  const b = { id: s.nextId++, type: 'leak', x, y: 0.5, speed: 0.2 };
  s.bubbles.push(b);
  return b;
};
// Advance the clock without letting cards or hearings interrupt.
const runFor = (s, secs, rng) => {
  for (let t = 0; t < secs && s.phase === 'play'; t += 0.05) { s.cardTimer = 99; tick(s, 0.05, rng); }
};

test('the same seed replays the same run', () => {
  const a = fresh(7); const b = fresh(7);
  runFor(a.s, 20, a.rng); runFor(b.s, 20, b.rng);
  assert.deepEqual(a.s.table.map((t) => t.pts), b.s.table.map((t) => t.pts));
  assert.equal(a.s.bubbles.length, b.s.bubbles.length);
});

test('dailySeed is a stable YYYYMMDD number', () => {
  assert.equal(dailySeed(new Date(Date.UTC(2026, 9, 9))), 20261009);
});

test('a new run starts in the Championship with a full table', () => {
  const { s } = fresh();
  assert.equal(division(s).name, 'Championship');
  assert.equal(leagueTable(s).length, division(s).teams);
  assert.equal(s.phase, 'play');
});

test('weeks advance with the clock and the season ends on time', () => {
  const { s, rng } = fresh();
  runFor(s, SEASON_SECONDS / 2, rng);
  assert.ok(s.week >= WEEKS / 2 - 1 && s.week <= WEEKS / 2 + 1);
  runFor(s, SEASON_SECONDS, rng);
  assert.equal(s.phase, 'seasonEnd');
  assert.equal(s.history.length, 1);
});

test('deal bubbles spawn and expire', () => {
  const { s, rng } = fresh();
  runFor(s, 3, rng);
  assert.ok(s.bubbles.some((b) => b.type === 'deal'));
  const first = s.bubbles.find((b) => b.type === 'deal').id;
  runFor(s, 7, rng);
  assert.ok(!s.bubbles.some((b) => b.id === first));
});

test('collecting a recurring deal books revenue and adds heat', () => {
  const { s, rng } = fresh();
  const before = bookedRevenue(s);
  const res = collect(s, addDeal(s, 'airline').id, rng);
  assert.ok(res.heat > 0);
  assert.equal(s.heat, res.heat);
  assert.ok(Math.abs(bookedRevenue(s) - before - 10) < 1e-9);
  assert.equal(s.deals[0].left, DEAL_TERM);
});

test('inflated deals are much hotter than fair ones', () => {
  const a = fresh(); const b = fresh();
  const fair = collect(a.s, addDeal(a.s, 'airline', 1).id, a.rng).heat;
  const absurd = collect(b.s, addDeal(b.s, 'airline', 4).id, b.rng).heat;
  assert.ok(absurd > fair * 5);
});

test('the regulator learns: reusing a method makes it hotter', () => {
  const { s, rng } = fresh();
  const first = collect(s, addDeal(s, 'partners').id, rng).heat;
  s.heat = 0;
  const second = collect(s, addDeal(s, 'partners').id, rng).heat;
  assert.ok(second > first);
  assert.ok(methodHeatMult(s, 'partners') > methodHeatMult(s, 'airline'));
});

test('off-book money raises squad strength without booking revenue, and leaks', () => {
  const { s, rng } = fresh();
  const rev = bookedRevenue(s); const str = strength(s);
  collect(s, addDeal(s, 'image').id, rng);
  assert.equal(bookedRevenue(s), rev);
  assert.ok(strength(s) > str);
  assert.ok(s.bubbles.some((b) => b.type === 'leak'));
});

test('an unshredded leak grows the case file; a shredded one does not', () => {
  const a = fresh();
  addLeak(a.s, 0.99);
  a.s.cardTimer = 99;
  tick(a.s, 0.1, a.rng);
  assert.ok(a.s.caseFile > 0);

  const b = fresh();
  const leak = addLeak(b.s, 0.99);
  assert.equal(shred(b.s, leak.id), true);
  b.s.cardTimer = 99;
  tick(b.s, 0.1, b.rng);
  assert.equal(b.s.caseFile, 0);
});

test('high heat fills the case file; low heat lets it go cold', () => {
  const hot = fresh();
  runFor(hot.s, 0.05, hot.rng);
  hot.s.heat = 100; hot.s.bubbles = []; hot.s.leakTimer = 99;
  hot.s.cardTimer = 99; tick(hot.s, 1, hot.rng);
  assert.ok(hot.s.caseFile > 1);

  const cold = fresh();
  cold.s.caseFile = 50; cold.s.heat = 0;
  runFor(cold.s, 5, cold.rng);
  assert.ok(cold.s.caseFile < 50);
});

test('a full case file triggers a hearing; accepting costs points and a charge', () => {
  const { s, rng } = fresh();
  s.caseFile = 100;
  tick(s, 0.05, rng);
  assert.equal(s.phase, 'card');
  assert.ok(s.card.hearing);
  const pts = s.pts;
  choose(s, 'left', rng);
  assert.equal(s.charges, 1);
  assert.equal(s.pts, pts - division(s).ptsPenalty);
  assert.ok(s.caseFile < 100);
  assert.equal(s.phase, 'play');
});

test(`${MAX_CHARGES} proven charges means expulsion`, () => {
  const { s, rng } = fresh();
  for (let i = 0; i < MAX_CHARGES; i++) {
    s.caseFile = 100;
    tick(s, 0.05, rng);
    choose(s, 'left', rng);
  }
  assert.equal(s.phase, 'over');
  assert.equal(s.over.reason, 'expelled');
  assert.equal(stars(s), 0);
});

test('choice cards apply their effects', () => {
  const { s, rng } = fresh();
  s.card = CARDS.find((c) => c.id === 'tickets');
  s.phase = 'card';
  const fans = s.fans;
  choose(s, 'left', rng);
  assert.equal(s.fans, fans - 12);
  assert.equal(s.phase, 'play');
});

test('fans hitting zero ends the run in a revolt', () => {
  const { s, rng } = fresh();
  s.fans = 5;
  s.card = CARDS.find((c) => c.id === 'tickets');
  s.phase = 'card';
  choose(s, 'left', rng);
  assert.equal(s.over.reason, 'revolt');
});

test('honest top-ups add no heat but breaching the loss limit costs points next season', () => {
  const { s, rng } = fresh();
  while (ffpHeadroom(s) >= 0) topUp(s);
  assert.equal(s.heat, 0);
  runFor(s, SEASON_SECONDS + 1, rng);
  assert.equal(s.phase, 'seasonEnd');
  assert.ok(s.lastSeason.ffpBreach);
  assert.ok(s.pts < 0);
});

test('topUpAmount scales with the division', () => {
  const { s } = fresh();
  assert.equal(topUpAmount(s), division(s).scale * 2);
});

test('strength rises with spend on a log scale', () => {
  assert.ok(strengthFromSpend(100) > strengthFromSpend(10));
  assert.ok(Math.abs(strengthFromSpend(999) - 60) < 0.01);
});

test('Money League rank improves with revenue', () => {
  const { s } = fresh();
  assert.ok(moneyRank(s, 2000) === 1);
  assert.ok(moneyRank(s, 10) === 11);
});

test('recurring deals expire after their term', () => {
  const { s, rng } = fresh();
  collect(s, addDeal(s, 'airline').id, rng);
  for (let i = 0; i < DEAL_TERM; i++) {
    runFor(s, SEASON_SECONDS + 1, rng);
    if (s.phase === 'card') choose(s, 'left', rng);
    nextSeason(s);
  }
  assert.equal(s.deals.length, 0);
});

test('every method and card is well formed', () => {
  for (const m of METHODS) assert.ok(['recurring', 'oneoff', 'offbook'].includes(m.kind), m.id);
  for (const c of CARDS) {
    for (const side of ['left', 'right']) {
      assert.ok(c[side].label, `${c.id}.${side}`);
      assert.ok(c[side].fx, `${c.id}.${side}.fx`);
    }
  }
});

// A simple bot plays to the end: the run must always terminate cleanly.
test('a full run always terminates with a valid ending and share text', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const rng = mulberry32(seed);
    const s = newRun({ seed }, rng);
    let guard = 0;
    while (s.phase !== 'over' && guard++ < 50000) {
      if (s.phase === 'play') {
        tick(s, 0.1, rng);
        for (const b of [...s.bubbles]) {
          if (b.type === 'deal' && s.heat < 40) collect(s, b.id, rng);
          if (b.type === 'leak') shred(s, b.id);
        }
      } else if (s.phase === 'card') choose(s, 'left', rng);
      else nextSeason(s);
    }
    assert.equal(s.phase, 'over', `seed ${seed}`);
    assert.ok(['complete', 'expelled', 'revolt'].includes(s.over.reason));
    if (s.over.reason === 'complete') assert.equal(s.history.length, SEASONS);
    assert.match(shareText(s), /Sportswash/);
  }
});
