import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, WEEKS, SEASON_SECONDS, MAX_CHARGES, DEAL_TERM, CARDS, METHODS, CONTACTS, STING, LEGENDS, FUNNELS, RAID, COMBO, BIG_MATCH } from '../v2/js/data.js';
import {
  newRun, tick, collect, shred, topUp, choose, nextSeason, mulberry32, dailySeed,
  bookedRevenue, strength, strengthFromSpend, methodHeatMult, moneyRank, leagueTable,
  ffpHeadroom, topUpAmount, stars, shareText, division,
  enterMeeting, meetingSay, leaveMeeting, wiredChance, contactById, exposePenalty,
  openTransfer, signTransfer, passTransfer, funnelHeat, squadSpend, comboMult,
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
  assert.equal(a.s.leaksLanded, 1);

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

// --- the back room ---------------------------------------------------------------
const addDoor = (s) => {
  const b = { id: s.nextId++, type: 'door', x: 0.5, y: 0.5, life: 7, maxLife: 7 };
  s.bubbles.push(b);
  return b;
};
const meet = (wired, seed = 3) => {
  const { s, rng } = fresh(seed);
  enterMeeting(s, addDoor(s).id, rng);
  s.meeting.wired = wired;
  return { s, rng };
};
// Run the clock until the exposé card appears (or give up).
const untilExpose = (s, rng) => {
  for (let t = 0; t < 30 && !(s.phase === 'card' && s.card?.expose); t += 0.05) {
    s.cardTimer = 99;
    if (s.phase === 'card' && !s.card.expose) choose(s, 'left', rng);
    else tick(s, 0.05, rng);
  }
};

test('a back-room door appears once each season', () => {
  const { s, rng } = fresh();
  runFor(s, SEASON_SECONDS - 1, rng);
  const doorsSeen = s.doorShown;
  assert.equal(doorsSeen, true);
  assert.ok(s.doorWeek >= 6 && s.doorWeek < 30);
});

test('entering the back room pauses the season', () => {
  const { s, rng } = fresh();
  enterMeeting(s, addDoor(s).id, rng);
  assert.equal(s.phase, 'meeting');
  const week = s.week;
  tick(s, 5, rng);
  assert.equal(s.week, week);
  assert.equal(s.meeting.lines.length, 1);
});

test('reckless lines pay more and put more on tape', () => {
  const a = meet(false); const b = meet(false);
  meetingSay(a.s, 0, a.rng);
  meetingSay(b.s, 2, b.rng);
  assert.equal(a.s.meeting.tape, 0);
  assert.ok(b.s.meeting.tape >= 2);
});

test('favours land even if you walk out early', () => {
  const { s, rng } = meet(false);
  const c = contactById(s.meeting.contactId);
  const fx = c.rounds[0].options[2].fx;
  const before = { spend: s.cardSpend, case: s.caseFile, pts: s.pts, deals: s.deals.length, oneoff: s.oneoff };
  meetingSay(s, 2, rng);
  const res = leaveMeeting(s, rng);
  assert.equal(res.result, 'clean');
  assert.equal(s.phase, 'play');
  const changed = s.cardSpend !== before.spend || s.pts !== before.pts || s.deals.length !== before.deals || s.oneoff !== before.oneoff || Object.keys(fx).length === 0;
  assert.ok(changed);
});

test('a clean room never leads to a story', () => {
  const { s, rng } = meet(false);
  for (let i = 0; i < 3; i++) meetingSay(s, 2, rng);
  assert.equal(s.phase, 'play');
  assert.equal(s.expose, null);
});

test('a wired room with nothing said: the reporter gets nothing', () => {
  const { s, rng } = meet(true);
  for (let i = 0; i < 3; i++) meetingSay(s, 0, rng);
  assert.equal(s.expose, null);
  assert.match(s.news[0].text, /nothing usable/);
});

test('a wired room with reckless talk becomes a front page weeks later', () => {
  const { s, rng } = meet(true);
  meetingSay(s, 2, rng);
  const res = leaveMeeting(s, rng);
  assert.equal(res.result, 'stung');
  assert.ok(s.expose.weeks >= STING.weeks[0] && s.expose.weeks <= STING.weeks[1]);
  const week = s.week;
  untilExpose(s, rng);
  assert.ok(s.card?.expose, 'exposé card should appear');
  assert.ok(s.week - week >= STING.weeks[0]);
  assert.match(s.card.text, /caught on camera/);
});

test('riding out an exposé applies the penalty and makes papers keener', () => {
  const { s, rng } = meet(true);
  meetingSay(s, 2, rng);
  leaveMeeting(s, rng);
  const sev = s.expose.severity;
  untilExpose(s, rng);
  s.heat = 0; s.caseFile = 0; s.fans = 80;
  const contact = CONTACTS[0];
  const before = wiredChance(s, contact);
  choose(s, 'right', rng);
  const p = exposePenalty(sev);
  assert.equal(s.caseFile, p.case);
  assert.equal(s.fans, 80 + p.fans);
  assert.equal(s.stings, 1);
  assert.ok(wiredChance(s, contact) > before);
});

test('a refused injunction makes the story bigger', () => {
  const { s, rng } = meet(true);
  meetingSay(s, 2, rng);
  leaveMeeting(s, rng);
  const sev = s.expose.severity;
  untilExpose(s, rng);
  s.heat = 0; s.caseFile = 0;
  choose(s, 'left', () => 0.99); // the injunction roll fails
  assert.equal(s.caseFile, exposePenalty(sev + 1).case);
});

test('a granted injunction kills the story', () => {
  const { s, rng } = meet(true);
  meetingSay(s, 2, rng);
  leaveMeeting(s, rng);
  untilExpose(s, rng);
  s.caseFile = 0;
  choose(s, 'left', () => 0.01);
  assert.equal(s.caseFile, 0);
  assert.equal(s.stings, 0);
});

test('hotter clubs are likelier to be stung', () => {
  const { s } = fresh();
  const c = CONTACTS[0];
  const cold = wiredChance(s, c);
  s.heat = 100;
  assert.ok(wiredChance(s, c) > cold);
  assert.ok(cold < 0.15, 'stings should be a small chance when cold');
});

test('every contact has three rounds of safe, bold and reckless options', () => {
  for (const c of CONTACTS) {
    assert.equal(c.rounds.length, 3, c.id);
    for (const r of c.rounds) {
      assert.deepEqual(r.options.map((o) => o.tone), ['safe', 'bold', 'reckless'], c.id);
      assert.equal(r.options[0].tape, 0);
      assert.ok(r.options[2].tape > r.options[1].tape);
    }
  }
});

// --- the transfer market -----------------------------------------------------------
const addStar = (s, legendId = 'shilton') => {
  const b = { id: s.nextId++, type: 'transfer', legendId, x: 0.5, y: 0.5, life: 6, maxLife: 6 };
  s.bubbles.push(b);
  return b;
};
const offer = (seed = 5, legendId) => {
  const { s, rng } = fresh(seed);
  openTransfer(s, addStar(s, legendId).id, rng);
  return { s, rng };
};

test('star transfers pop up during the season', () => {
  const { s, rng } = fresh();
  runFor(s, 20, rng);
  assert.ok(s.bubbles.some((b) => b.type === 'transfer') || s.transferTimer < 30);
});

test('opening a transfer pauses play; the real price beats the public fee', () => {
  const { s } = offer();
  assert.equal(s.phase, 'transfer');
  assert.ok(s.transfer.realPrice > s.transfer.publicFee * 3);
  assert.ok(s.transfer.gap > 0);
});

test('paying honestly adds no heat but uses up FFP headroom', () => {
  const { s, rng } = offer();
  const gap = s.transfer.gap;
  const spend = squadSpend(s);
  signTransfer(s, 'honest', rng);
  assert.equal(s.heat, 0);
  assert.equal(s.topUps, gap);
  assert.ok(squadSpend(s) > spend);
  assert.equal(s.phase, 'play');
});

test('Bermuda image rights are hot and leak a document', () => {
  const { s, rng } = offer();
  signTransfer(s, 'bermuda', rng);
  assert.ok(s.heat > 0);
  assert.ok(s.bubbles.some((b) => b.type === 'leak'));
});

test('reusing a funnel makes it hotter', () => {
  const { s, rng } = offer(5, 'pele');
  const first = funnelHeat(s, 'sister');
  signTransfer(s, 'sister', rng);
  openTransfer(s, addStar(s, 'zidane').id, rng);
  const ratio = funnelHeat(s, 'sister') / Math.sqrt(s.transfer.gap);
  passTransfer(s);
  const fresh2 = offer(5, 'zidane');
  const ratio0 = funnelHeat(fresh2.s, 'sister') / Math.sqrt(fresh2.s.transfer.gap);
  assert.ok(first > 0);
  assert.ok(ratio > ratio0);
});

test('agents sometimes talk', () => {
  const talk = offer();
  signTransfer(talk.s, 'agent', () => 0.01);
  assert.ok(talk.s.caseFile > 0);
  const quiet = offer();
  signTransfer(quiet.s, 'agent', () => 0.99);
  assert.equal(quiet.s.caseFile, 0);
});

test('a signed legend is never offered again; walking away costs nothing', () => {
  const { s, rng } = offer(5, 'pele');
  signTransfer(s, 'honest', rng);
  assert.deepEqual(s.signed, ['pele']);
  for (let i = 0; i < 200; i++) { s.transferTimer = 0; s.cardTimer = 99; tick(s, 0.01, rng); }
  assert.ok(!s.bubbles.some((b) => b.type === 'transfer' && b.legendId === 'pele'));

  const walk = offer();
  passTransfer(walk.s);
  assert.equal(walk.s.phase, 'play');
  assert.equal(walk.s.heat, 0);
  assert.equal(walk.s.signed.length, 0);
});

test('every legend and funnel is well formed', () => {
  const ids = new Set(LEGENDS.map((l) => l.id));
  assert.equal(ids.size, LEGENDS.length);
  for (const l of LEGENDS) assert.ok(l.rating > 70 && l.rating <= 99, l.id);
  assert.ok(FUNNELS.some((f) => f.id === 'honest' && f.heat === 0));
});

// --- combos ---------------------------------------------------------------------------
test('fair-value deals in a row build a growing multiplier', () => {
  const { s, rng } = fresh();
  const a = collect(s, addDeal(s, 'airline', 1, 10).id, rng);
  const b = collect(s, addDeal(s, 'airline', 1, 10).id, rng);
  const c = collect(s, addDeal(s, 'partners', 1, 10).id, rng);
  assert.equal(a.mult, 1);
  assert.ok(b.value > a.value && c.value > b.value);
  assert.equal(s.combo, 3);
  assert.equal(comboMult(1000), 1 + COMBO.step * COMBO.max);
});

test('an inflated deal, off-book money or a landed leak breaks the streak', () => {
  const { s, rng } = fresh();
  collect(s, addDeal(s, 'airline', 1).id, rng);
  collect(s, addDeal(s, 'airline', 2).id, rng);
  assert.equal(s.combo, 0);
  collect(s, addDeal(s, 'airline', 1).id, rng);
  collect(s, addDeal(s, 'image', 1).id, rng);
  assert.equal(s.combo, 0);
  collect(s, addDeal(s, 'airline', 1).id, rng);
  s.bubbles = [];
  addLeak(s, 0.999);
  s.cardTimer = 99;
  tick(s, 0.05, rng);
  assert.equal(s.combo, 0);
  assert.ok(s.bestCombo >= 1);
});

// --- dawn raids -------------------------------------------------------------------------
const raidRun = (shredAll, seed = 9) => {
  const { s, rng } = fresh(seed);
  s.heat = RAID.heat + 5;
  s.cardTimer = 99;
  tick(s, 0.05, rng);
  assert.ok(s.raid, 'raid should start at high heat');
  for (let t = 0; t < 30 && s.raid; t += 0.05) {
    s.cardTimer = 99;
    s.caseFile = Math.min(s.caseFile, 50); // keep hearings out of the way
    if (shredAll) for (const b of [...s.bubbles]) if (b.type === 'leak') shred(s, b.id);
    tick(s, 0.05, rng);
  }
  return s;
};

test('a dawn raid floods the pitch with fast leaks and stops new deals', () => {
  const { s, rng } = fresh(9);
  s.heat = 95; s.cardTimer = 99;
  tick(s, 0.05, rng);
  s.bubbles = s.bubbles.filter((b) => b.type !== 'deal');
  for (let i = 0; i < 40; i++) { s.cardTimer = 99; tick(s, 0.05, rng); }
  const leaks = s.bubbles.filter((b) => b.type === 'leak' && b.raid);
  assert.ok(leaks.length >= 3);
  assert.ok(!s.bubbles.some((b) => b.type === 'deal'));
});

test('shredding everything makes the raid find nothing and cools you down', () => {
  const s = raidRun(true);
  assert.equal(s.raid, null);
  assert.ok(s.lastRaid.clean);
  assert.ok(s.lastRaid.spawned >= RAID.seconds / RAID.every - 2);
});

test('a messy raid adds to the case file', () => {
  const s = raidRun(false);
  assert.equal(s.lastRaid.clean, false);
  assert.ok(s.lastRaid.missed > RAID.allowMiss);
});

test('only one raid per season', () => {
  const s = raidRun(true);
  s.heat = 99;
  s.cardTimer = 99;
  tick(s, 0.05, mulberry32(1));
  assert.equal(s.raid, null);
  assert.equal(s.raids, 1);
});

// --- big matches ----------------------------------------------------------------------
test('each season has big matches with a goal-by-goal result', () => {
  const { s, rng } = fresh();
  assert.equal(s.bigWeeks.length, BIG_MATCH.perSeason);
  runFor(s, SEASON_SECONDS + 1, rng);
  assert.equal(s.bigMatches, BIG_MATCH.perSeason);
  const m = s.lastBigMatch;
  assert.equal(m.events.filter((e) => e.side === 'you').length, m.you);
  assert.equal(m.events.filter((e) => e.side === 'them').length, m.them);
  for (let i = 1; i < m.events.length; i++) assert.ok(m.events[i].min >= m.events[i - 1].min);
});

test('signed legends score in big matches', () => {
  let legendGoals = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const { s, rng } = fresh(seed);
    s.signed = ['pele', 'maradona', 'zidane'];
    runFor(s, SEASON_SECONDS + 1, rng);
    legendGoals += s.news.filter((n) => /Pel|Marodona|Zidame/.test(n.text)).length;
  }
  assert.ok(legendGoals > 0);
});
