// v2 engine: real-time. Pure logic, no DOM, so it runs under `node --test`.
// Every random roll goes through an injected rng, so a seed replays a run.
//
// Two bars race each other:
//   Empire     - booked revenue climbing the Football Money League.
//   Case File  - the regulator's progress. It fills with Heat (squared), leaks
//                you fail to shred, and bad choices. At 100 you face a hearing.
// The regulator learns: each reuse of a method makes it hotter next time.
import {
  SEASONS, SEASON_SECONDS, WEEKS, SQUAD_SHARE, DEAL_TERM, MAX_CHARGES, DIVISIONS, START,
  METHODS, INFLATION, MONEY_LEAGUE, RIVAL_GROWTH, TOWNS, SUFFIXES, CARDS,
  CONTACTS, TELLS, SMALL_TALK, STING, NEWSPAPER, LEGENDS, FUNNELS,
} from './data.js';

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const divisionByTier = (tier) => DIVISIONS.find((d) => d.tier === tier);
export const methodById = (id) => METHODS.find((m) => m.id === id);
const pickFrom = (arr, rng) => arr[Math.floor(rng() * arr.length)];
const sig = (x) => 1 / (1 + Math.exp(-x));

const DEAL_LIFE = 5.5;       // seconds a deal bubble stays on screen
const LEAK_CASE = 6;         // case file per un-shredded leak (x scrutiny)
const CARD_GAP = [18, 28];   // seconds between choice cards
const TRANSFER_LIFE = 6;     // seconds a star transfer stays on offer
const TRANSFER_GAP = [16, 30]; // seconds between star transfers
const DOOR_LIFE = 7;         // seconds the back-room door stays open
const HEAT_DECAY = 1.5;      // heat lost per second
const COLD_CASE = 0.15;      // case file lost per second while heat is low

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const dailySeed = (date = new Date()) =>
  date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();

export function formatMoney(m) {
  const abs = Math.abs(m);
  const sign = m < 0 ? '-' : '';
  if (abs >= 1000) return `${sign}£${(abs / 1000).toFixed(1)}bn`;
  if (abs >= 1) return `${sign}£${abs.toFixed(abs >= 100 ? 0 : 1).replace(/\.0$/, '')}m`;
  return `${sign}£${Math.round(abs * 1000)}k`;
}

// Squad strength on a log scale: each 10x in spend is worth +20.
export const strengthFromSpend = (spend) => 20 * Math.log10(1 + Math.max(0, spend));

function makeTable(div, rng, yourName) {
  const teams = [];
  const used = new Set([yourName]);
  while (teams.length < div.teams - 1) {
    const name = `${pickFrom(TOWNS, rng)} ${pickFrom(SUFFIXES, rng)}`;
    if (used.has(name)) continue;
    used.add(name);
    const spend = div.spendLo * (div.spendHi / div.spendLo) ** rng();
    teams.push({ name, strength: strengthFromSpend(spend), pts: 0 });
  }
  return teams;
}

export function newRun({ clubName = 'Sportswash FC', seed = 1 } = {}, rng = Math.random) {
  const div = divisionByTier(START.tier);
  const s = {
    seed,
    seasonNo: 1, week: 0, clock: 0,
    tier: START.tier,
    club: clubName,
    revFactor: START.revFactor,
    brand: 1,
    fans: START.fans,
    heat: 0,
    caseFile: 0,
    charges: 0,          // proven charges; MAX_CHARGES = expelled
    hearings: 0,
    deals: [],           // recurring: { methodId, value, left }
    oneoff: 0,           // booked this season only
    offbook: 0,          // squad money that never hits the accounts
    topUps: 0,           // honest owner equity this season (counts as an FFP loss)
    cardSpend: 0,        // squad money moved by card choices this season
    baseSpend: START.spend,
    pts: 0,
    uses: {},            // how often each method has been used (regulator learning)
    table: makeTable(div, rng, clubName),
    bubbles: [],
    nextId: 1,
    dealTimer: 1.5,
    leakTimer: 1,
    cardTimer: 12,
    phase: 'play',       // play | card | meeting | transfer | seasonEnd | over
    card: null,
    lastSeason: null,
    history: [],
    news: [],
    seenCards: [],
    leaksLanded: 0,      // documents that reached the press
    doorWeek: 6 + Math.floor(rng() * 24), // when this season's back-room invitation appears
    doorShown: false,
    meeting: null,       // the back-room meeting in progress
    expose: null,        // a sting awaiting publication: { weeks, severity, quote }
    stings: 0,           // stings published so far
    transferTimer: 14,
    transfer: null,      // the star transfer being negotiated
    signed: [],          // legend ids signed this run
    over: null,          // { reason: 'complete' | 'expelled' | 'revolt' }
  };
  return s;
}

// --- money ------------------------------------------------------------------
export const division = (s) => divisionByTier(s.tier);
export const genuineRevenue = (s) => division(s).base * s.revFactor * s.brand * (0.5 + s.fans / 100);
export const recurringRevenue = (s) => s.deals.reduce((t, d) => t + d.value, 0);
export const bookedRevenue = (s) => genuineRevenue(s) + recurringRevenue(s) + s.oneoff;
export const squadSpend = (s) => Math.max(0, s.baseSpend + SQUAD_SHARE * bookedRevenue(s) + s.offbook + s.topUps + s.cardSpend);
export const strength = (s) => strengthFromSpend(squadSpend(s));
// Related-party money as a multiple of genuine revenue: what the regulator stares at.
export const fakeRatio = (s) => (recurringRevenue(s) + s.oneoff) / Math.max(1, genuineRevenue(s));
export const methodHeatMult = (s, id) => 1 + 0.2 * (s.uses[id] || 0);
export const topUpAmount = (s) => division(s).scale * 2;

export function moneyLeague(s, revenue = bookedRevenue(s)) {
  const g = RIVAL_GROWTH ** (s.seasonNo - 1);
  const rows = MONEY_LEAGUE.map((r) => ({ name: r.name, revenue: r.revenue * g }));
  rows.push({ name: s.club, revenue, you: true });
  rows.sort((a, b) => b.revenue - a.revenue);
  return rows;
}
export const moneyRank = (s, revenue) => moneyLeague(s, revenue).findIndex((r) => r.you) + 1;

export function leagueTable(s) {
  const rows = s.table.map((t) => ({ name: t.name, pts: t.pts, strength: t.strength }));
  rows.push({ name: s.club, pts: s.pts, strength: strength(s), you: true });
  rows.sort((a, b) => b.pts - a.pts || b.strength - a.strength);
  return rows;
}
export const leaguePosition = (s) => leagueTable(s).findIndex((r) => r.you) + 1;

function addNews(s, text, tone = '') {
  s.news.unshift({ text, tone, season: s.seasonNo, week: s.week });
  s.news.length = Math.min(s.news.length, 8);
}

// --- the real-time loop --------------------------------------------------------
function spawnDeal(s, rng) {
  const total = METHODS.reduce((t, m) => t + m.weight, 0);
  let r = rng() * total;
  const m = METHODS.find((x) => (r -= x.weight) < 0) || METHODS[0];
  let q = rng();
  const infl = INFLATION.find((x) => (q -= x.p) < 0) || INFLATION[0];
  const value = m.value * division(s).scale * infl.mult * (0.75 + 0.5 * rng()) * Math.sqrt(s.brand);
  s.bubbles.push({
    id: s.nextId++, type: 'deal', methodId: m.id, infl: infl.mult, value,
    x: 0.08 + 0.72 * rng(), y: 0.12 + 0.76 * rng(), life: DEAL_LIFE, maxLife: DEAL_LIFE,
  });
}

function spawnLeak(s, rng) {
  s.bubbles.push({ id: s.nextId++, type: 'leak', x: 0, y: 0.1 + 0.8 * rng(), speed: (1 + s.heat / 100) / 7 });
}

function playWeek(s, rng) {
  const all = [...s.table.map((t) => t.strength), strength(s)];
  const avg = all.reduce((a, b) => a + b, 0) / all.length;
  const result = (str) => {
    const pw = 0.12 + 0.6 * sig((str - avg) / 4);
    const r = rng();
    return r < pw ? 3 : r < pw + 0.26 ? 1 : 0;
  };
  for (const t of s.table) t.pts += result(t.strength);
  const pts = result(strength(s));
  s.pts += pts;
  s.fans = clamp(s.fans + (pts === 3 ? 1.2 : pts === 0 ? -1.4 : 0), 0, 100);
  s.week++;
  if (s.expose) s.expose.weeks--;
  return pts;
}

export function tick(s, dt, rng = Math.random) {
  if (s.phase !== 'play') return;
  // A card choice can fill the file between ticks; catch it before it can decay.
  if (s.caseFile >= 100) return openHearing(s);
  const div = division(s);
  s.clock += dt;

  const weekLen = SEASON_SECONDS / WEEKS;
  while (s.week < WEEKS && s.clock >= (s.week + 1) * weekLen) playWeek(s, rng);

  // Heat: passive from how fake the revenue is, minus a steady cool-down.
  const passive = Math.min(3, 0.6 * Math.max(0, fakeRatio(s) - 0.75) * div.scrutiny);
  s.heat = clamp(s.heat + dt * (passive - HEAT_DECAY), 0, 100);
  // The case only really moves when you're hot, and goes cold if you lie low.
  const caseRate = s.heat < 20 ? -COLD_CASE : div.scrutiny * 1.1 * (s.heat / 100) ** 2.5;
  s.caseFile = clamp(s.caseFile + dt * caseRate, 0, 100);

  s.dealTimer -= dt;
  if (s.dealTimer <= 0) { spawnDeal(s, rng); s.dealTimer = 2 + 2.5 * rng(); }

  s.leakTimer -= dt * (0.03 + 0.25 * s.heat / 100);
  if (s.leakTimer <= 0) { spawnLeak(s, rng); s.leakTimer = 0.5 + rng(); }

  s.transferTimer -= dt;
  if (s.transferTimer <= 0) {
    spawnTransfer(s, rng);
    s.transferTimer = TRANSFER_GAP[0] + (TRANSFER_GAP[1] - TRANSFER_GAP[0]) * rng();
  }

  if (!s.doorShown && s.week >= s.doorWeek) {
    s.doorShown = true;
    s.bubbles.push({ id: s.nextId++, type: 'door', x: 0.15 + 0.6 * rng(), y: 0.2 + 0.6 * rng(), life: DOOR_LIFE, maxLife: DOOR_LIFE });
  }

  for (const b of s.bubbles) {
    if (b.type === 'leak') b.x += b.speed * dt;
    else b.life -= dt;
  }
  for (const b of s.bubbles.filter((x) => x.type === 'leak' && x.x >= 1)) {
    s.caseFile = clamp(s.caseFile + LEAK_CASE * div.scrutiny, 0, 100);
    s.heat = clamp(s.heat + 3, 0, 100);
    s.leaksLanded++;
    addNews(s, 'A document reached the press.', 'bad');
  }
  s.bubbles = s.bubbles.filter((b) => (b.type === 'leak' ? b.x < 1 : b.life > 0));

  if (s.fans <= 0) return finish(s, 'revolt');
  if (s.caseFile >= 100) return openHearing(s);
  if (s.expose && s.expose.weeks <= 0) return openExpose(s);
  if (s.week >= WEEKS) return endSeason(s, rng);

  s.cardTimer -= dt;
  if (s.cardTimer <= 0) drawCard(s, rng);
}

// --- player actions ----------------------------------------------------------
export function collect(s, id, rng = Math.random) {
  const b = s.bubbles.find((x) => x.id === id && x.type === 'deal');
  if (!b || s.phase !== 'play') return null;
  const m = methodById(b.methodId);
  const heat = m.heat * b.infl ** 1.4 * methodHeatMult(s, m.id) * division(s).scrutiny;
  s.heat = clamp(s.heat + heat, 0, 100);
  s.uses[m.id] = (s.uses[m.id] || 0) + 1;
  if (m.kind === 'recurring') s.deals.push({ methodId: m.id, value: b.value, left: DEAL_TERM });
  else if (m.kind === 'oneoff') s.oneoff += b.value;
  else { s.offbook += b.value; spawnLeak(s, rng); }
  s.bubbles = s.bubbles.filter((x) => x !== b);
  return { method: m, value: b.value, heat };
}

export function shred(s, id) {
  if (s.phase !== 'play') return false;
  const before = s.bubbles.length;
  s.bubbles = s.bubbles.filter((x) => !(x.id === id && x.type === 'leak'));
  return s.bubbles.length < before;
}

// Honest owner equity: no heat at all, but over the loss limit it's an FFP breach.
export function topUp(s) {
  if (s.phase !== 'play') return 0;
  const amt = topUpAmount(s);
  s.topUps += amt;
  return amt;
}
export const ffpHeadroom = (s) => division(s).lossLimit - s.topUps;

// --- cards ------------------------------------------------------------------------
function eligible(s, c) {
  if (c.minHeat && s.heat < c.minHeat) return false;
  if (c.maxFans && s.fans > c.maxFans) return false;
  return true;
}

function drawCard(s, rng) {
  let pool = CARDS.filter((c) => eligible(s, c) && !s.seenCards.includes(c.id));
  if (!pool.length) { s.seenCards = []; pool = CARDS.filter((c) => eligible(s, c)); }
  const c = pickFrom(pool, rng);
  s.seenCards.push(c.id);
  s.card = c;
  s.phase = 'card';
  s.cardTimer = CARD_GAP[0] + (CARD_GAP[1] - CARD_GAP[0]) * rng();
}

function openHearing(s) {
  s.hearings++;
  const div = division(s);
  s.card = {
    id: 'hearing', hearing: true, who: '⚖️', speaker: div.regulator,
    text: `You have been charged with ${40 + 25 * s.hearings} breaches of the financial rules. Proven so far: ${s.charges} of ${MAX_CHARGES} before expulsion.`,
    left: { label: `Accept a ${div.ptsPenalty}-point deduction`, odds: 1 },
    right: { label: 'Fight it with expensive lawyers', odds: fightOdds(s) },
  };
  s.phase = 'card';
}
export const fightOdds = (s) => clamp(0.5 - 0.12 * s.charges - 0.15 * (s.heat / 100), 0.1, 0.6);

function applyFx(s, fx) {
  const sc = division(s).scale;
  if (fx.heat) s.heat = clamp(s.heat + fx.heat, 0, 100);
  if (fx.case) s.caseFile = clamp(s.caseFile + fx.case, 0, 100);
  if (fx.fans) s.fans = clamp(s.fans + fx.fans, 0, 100);
  if (fx.brand) s.brand *= 1 + fx.brand;
  if (fx.spend) s.cardSpend += fx.spend * sc;
  if (fx.oneoff) s.oneoff += fx.oneoff * sc;
  if (fx.points) s.pts += fx.points;
  if (fx.deal) s.deals.push({ methodId: 'backroom', value: fx.deal * sc, left: DEAL_TERM });
}

// side: 'left' | 'right'. Returns a short outcome line for the UI.
export function choose(s, side, rng = Math.random) {
  if (s.phase !== 'card' || !s.card) return null;
  const c = s.card;
  const opt = c[side];
  let outcome = '';
  if (c.expose) {
    outcome = resolveExpose(s, side, rng);
    s.card = null;
  } else if (c.hearing) {
    const div = division(s);
    if (side === 'left') {
      s.pts -= div.ptsPenalty; s.charges++; s.caseFile = 35; s.heat *= 0.6;
      outcome = `Guilty plea. ${div.ptsPenalty} points deducted.`;
    } else if (rng() < opt.odds) {
      s.caseFile = 55; s.heat *= 0.8;
      outcome = 'Cleared on a technicality. The lawyers send their invoice.';
    } else {
      s.pts -= 2 * div.ptsPenalty; s.charges++; s.caseFile = 35; s.heat *= 0.6;
      outcome = `Lost. ${2 * div.ptsPenalty} points deducted.`;
    }
    addNews(s, outcome, 'bad');
    s.card = null;
    if (s.charges >= MAX_CHARGES) { finish(s, 'expelled'); return outcome; }
  } else {
    applyFx(s, opt.fx);
    if (opt.risk && rng() < opt.risk.p) {
      applyFx(s, opt.risk.fx);
      outcome = opt.risk.news;
      addNews(s, outcome, 'bad');
    }
    s.card = null;
  }
  s.phase = 'play';
  if (s.fans <= 0) finish(s, 'revolt');
  return outcome;
}

// --- the transfer market ------------------------------------------------------------
// A legend is on offer: a cheap public fee, and a much bigger real price. The gap
// has to be paid somehow, and every way of paying it has a cost.
export const legendById = (id) => LEGENDS.find((l) => l.id === id);
export const funnelById = (id) => FUNNELS.find((f) => f.id === id);

function spawnTransfer(s, rng) {
  const offered = new Set(s.bubbles.filter((b) => b.type === 'transfer').map((b) => b.legendId));
  const pool = LEGENDS.filter((l) => !s.signed.includes(l.id) && !offered.has(l.id));
  if (!pool.length) return;
  const l = pickFrom(pool, rng);
  s.bubbles.push({ id: s.nextId++, type: 'transfer', legendId: l.id, x: 0.1 + 0.65 * rng(), y: 0.15 + 0.7 * rng(), life: TRANSFER_LIFE, maxLife: TRANSFER_LIFE });
}

export function openTransfer(s, id, rng = Math.random) {
  const b = s.bubbles.find((x) => x.id === id && x.type === 'transfer');
  if (!b || s.phase !== 'play') return null;
  s.bubbles = s.bubbles.filter((x) => x !== b);
  const l = legendById(b.legendId);
  const sc = division(s).scale;
  const units = (l.rating - 70) / 5; // 2.8 to 5
  const publicFee = units * sc * 0.4;
  const realPrice = units * sc * (1.4 + 0.8 * rng());
  s.transfer = { legendId: l.id, units, publicFee, realPrice, gap: realPrice - publicFee };
  s.phase = 'transfer';
  return s.transfer;
}

// Heat for paying this gap through this funnel: bigger gaps and reused tricks run hotter.
export function funnelHeat(s, funnelId) {
  const f = funnelById(funnelId);
  if (!f.heat || !s.transfer) return 0;
  const sc = division(s).scale;
  return f.heat * Math.sqrt(s.transfer.gap / (2 * sc)) * methodHeatMult(s, f.uses) * division(s).scrutiny;
}

export function signTransfer(s, funnelId, rng = Math.random) {
  const t = s.transfer;
  const f = funnelById(funnelId);
  if (s.phase !== 'transfer' || !t || !f) return null;
  const l = legendById(t.legendId);
  const heat = funnelHeat(s, funnelId);
  s.heat = clamp(s.heat + heat, 0, 100);
  if (f.uses) s.uses[f.uses] = (s.uses[f.uses] || 0) + 1;
  if (f.id === 'honest') s.topUps += t.gap;
  if (f.id === 'bermuda') spawnLeak(s, rng);
  let talked = false;
  if (f.risk && rng() < f.risk.p) {
    talked = true;
    s.caseFile = clamp(s.caseFile + f.risk.case, 0, 100);
    addNews(s, f.risk.news, 'bad');
  }
  s.cardSpend += t.units * division(s).scale * 2;
  s.signed.push(l.id);
  addNews(s, `${l.name} signs for a "bargain" ${formatMoney(t.publicFee)}.`);
  s.transfer = null;
  s.phase = 'play';
  return { legend: l, heat, talked };
}

export function passTransfer(s) {
  if (s.phase !== 'transfer') return;
  s.transfer = null;
  s.phase = 'play';
}

// --- the back room ------------------------------------------------------------------
// A secret meeting: three rounds of push-your-luck. The room may be wired, and
// nothing tells you for sure, but tells turn up more often when it is.
export const contactById = (id) => CONTACTS.find((c) => c.id === id);
export const wiredChance = (s, contact) =>
  clamp(STING.base + STING.perHeat * (s.heat / 100) + STING.perSting * s.stings + contact.risk, 0, 0.9);

function narrate(s, rng) {
  const m = s.meeting;
  const tell = rng() < (m.wired ? STING.tellIfWired : STING.tellIfClean);
  const pool = tell ? TELLS.filter((t) => !m.lines.includes(t)) : SMALL_TALK.filter((t) => !m.lines.includes(t));
  m.lines.push(pickFrom(pool.length ? pool : SMALL_TALK, rng));
}

export function enterMeeting(s, id, rng = Math.random) {
  const b = s.bubbles.find((x) => x.id === id && x.type === 'door');
  if (!b || s.phase !== 'play') return null;
  s.bubbles = s.bubbles.filter((x) => x !== b);
  const contact = pickFrom(CONTACTS, rng);
  s.meeting = { contactId: contact.id, wired: rng() < wiredChance(s, contact), round: 0, tape: 0, said: [], lines: [] };
  narrate(s, rng);
  s.phase = 'meeting';
  return s.meeting;
}

// Pick option i of the current round. Favours land straight away.
export function meetingSay(s, i, rng = Math.random) {
  const m = s.meeting;
  if (s.phase !== 'meeting' || !m) return null;
  const contact = contactById(m.contactId);
  const opt = contact.rounds[m.round]?.options[i];
  if (!opt) return null;
  applyFx(s, opt.fx);
  m.tape += opt.tape;
  m.said.push(opt);
  m.round++;
  if (m.round >= contact.rounds.length) return leaveMeeting(s, rng);
  narrate(s, rng);
  return { done: false };
}

// Walk out (or finish). If the room was wired and you said anything usable,
// the paper starts "seeking comment" and the story lands a few weeks later.
export function leaveMeeting(s, rng = Math.random) {
  const m = s.meeting;
  if (s.phase !== 'meeting' || !m) return null;
  let result = 'clean';
  if (m.wired && m.tape > 0) {
    const worst = m.said.reduce((a, b) => (b.tape > (a?.tape ?? -1) ? b : a), null);
    const [lo, hi] = STING.weeks;
    s.expose = { weeks: lo + Math.floor(rng() * (hi - lo + 1)), severity: m.tape, quote: worst.label };
    addNews(s, `${NEWSPAPER} is "seeking comment" about a recent meeting.`, 'bad');
    result = 'stung';
  } else if (m.wired) {
    addNews(s, `The "contact" was a ${NEWSPAPER} reporter. They got nothing usable.`);
    result = 'dodged';
  }
  s.meeting = null;
  s.phase = 'play';
  if (s.fans <= 0) finish(s, 'revolt');
  return { done: true, result };
}

function openExpose(s) {
  const e = s.expose;
  s.card = {
    id: 'expose', expose: true, who: '\u{1F5DE}️', speaker: `${NEWSPAPER}, front page`,
    text: `STING: ${s.club} chief caught on camera: "${e.quote}"`,
    left: { label: 'Seek a super-injunction', odds: STING.injunction },
    right: { label: 'No comment. Ride it out.' },
  };
  s.phase = 'card';
}

// Grows faster than the tape: a slip stings, a full confession means a hearing.
export function exposePenalty(severity) {
  return { case: 6 * severity + 1.5 * severity ** 2, heat: 12 * severity, fans: -4 * severity };
}

function resolveExpose(s, side, rng) {
  let sev = s.expose.severity;
  s.expose = null;
  if (side === 'left') {
    if (rng() < STING.injunction) {
      s.heat = clamp(s.heat + 8, 0, 100);
      const msg = 'Injunction granted. Nobody knows what it\'s about. Everyone knows what it\'s about.';
      addNews(s, msg);
      return msg;
    }
    sev++;
  }
  s.stings++;
  applyFx(s, exposePenalty(sev));
  const msg = side === 'left' ? 'Injunction refused, and now it\'s an even bigger story.' : 'The story runs. Every channel has the footage.';
  addNews(s, msg, 'bad');
  return msg;
}

// --- season end ----------------------------------------------------------------
function endSeason(s, rng) {
  const div = division(s);
  const pos = leaguePosition(s);
  const revenue = bookedRevenue(s);
  const rank = moneyRank(s, revenue);
  let moved = 0;
  if (div.up && pos <= div.up) moved = -1;
  else if (div.down && pos > div.teams - div.down) moved = 1;

  // Genuine pull grows with success, and a title is worth a lot.
  s.brand *= 1 + 0.15 * (1 - (pos - 1) / (div.teams - 1)) + (pos === 1 ? 0.15 : 0) + (moved < 0 ? 0.1 : 0);

  const ffpBreach = s.topUps > div.lossLimit;
  s.lastSeason = { seasonNo: s.seasonNo, division: div.name, pos, teams: div.teams, moved, revenue, rank, ffpBreach };
  s.history.push(s.lastSeason);

  s.tier += moved;
  const next = division(s);
  // Squad spend carries over (wages are sticky), shrinks if you drop a division.
  s.baseSpend = Math.max(next.spendLo * 0.5, (s.baseSpend + s.offbook + s.topUps + s.cardSpend) * (moved > 0 ? 0.6 : 0.85));
  for (const d of s.deals) d.left--;
  s.deals = s.deals.filter((d) => d.left > 0);
  s.oneoff = 0; s.offbook = 0; s.topUps = 0; s.cardSpend = 0;
  for (const k of Object.keys(s.uses)) s.uses[k] *= 0.5;
  s.heat *= 0.6;
  s.caseFile *= 0.75; // the summer break: some of the file goes stale
  s.pts = ffpBreach ? -next.ptsPenalty : 0;
  if (ffpBreach) s.caseFile = clamp(s.caseFile + 15, 0, 100);
  s.table = makeTable(next, rng, s.club);
  s.doorWeek = 6 + Math.floor(rng() * 24);
  s.doorShown = false;
  s.bubbles = [];
  s.week = 0; s.clock = 0;
  s.dealTimer = 1.5; s.leakTimer = 1;
  s.phase = 'seasonEnd';
}

export function nextSeason(s) {
  if (s.phase !== 'seasonEnd') return;
  if (s.seasonNo >= SEASONS) { finish(s, 'complete'); return; }
  s.seasonNo++;
  s.phase = 'play';
}

function finish(s, reason) {
  s.phase = 'over';
  s.card = null;
  s.over = { reason };
}

// --- scoring --------------------------------------------------------------------
export function bestRank(s) {
  return s.history.reduce((b, h) => Math.min(b, h.rank), 99);
}

// One star: a top-10 Money League season. Two: No. 1. Three: No. 1 with nothing proven.
export function stars(s) {
  if (s.over?.reason !== 'complete') return 0;
  const rank = bestRank(s);
  if (rank === 1) return s.charges === 0 ? 3 : 2;
  return rank <= 10 ? 1 : 0;
}

export function endingTitle(s) {
  const r = s.over?.reason;
  if (r === 'expelled') return 'Expelled. Derek wins.';
  if (r === 'revolt') return 'Fan revolt: forced to sell';
  const st = stars(s);
  return ['Too clean to matter', 'Respectable laundering', 'Richest club on Earth (allegedly)', 'The perfect sportswash'][st];
}

export function shareText(s, daily = false) {
  const st = stars(s);
  const marks = s.history.map((h) => (h.moved < 0 ? '⬆️' : h.moved > 0 ? '⬇️' : h.rank <= 10 ? '\u{1F4B0}' : '⚽')).join('');
  const verdict = s.over?.reason === 'expelled' ? '⚖️ Expelled' : s.over?.reason === 'revolt' ? '\u{1FAA7} Revolt' : `Best rank #${bestRank(s)}`;
  const stars3 = '⭐'.repeat(st) + '☆'.repeat(3 - st);
  return `\u{1F9FC} Sportswash & Go ${daily ? `Daily ${s.seed}` : ''}\n${stars3} ${verdict}\n${marks} ⚖️${s.charges}`.replace('  ', ' ');
}
