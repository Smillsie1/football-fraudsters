// Pure game logic. No DOM access here so it can be unit tested with `node --test`.
//
// Core model (financial fair play):
//   booked revenue = genuine revenue + recurring related-party deals + one-off sales
//   squad spend    = 70% of booked revenue + owner equity + off-book payments
//   FFP loss       = owner equity (the only spend not covered by booked revenue)
// So to spend big without breaching FFP you must make owner money look like revenue,
// and fair market value only rises as the club genuinely gets bigger (brand).
import { DIVISIONS, CLUBS, METHODS, LAWYERS, EVENTS, SEASONS, FUND, MONEY_LEAGUE, RIVAL_GROWTH, BREACH_VECTORS, RESPONSES, OBSTRUCTIONS, EBT, AMORTISATION, HMRC, REFEREES } from './data.js';

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const divisionByTier = (tier) => DIVISIONS.find((d) => d.tier === tier);
export const divisionById = (id) => DIVISIONS.find((d) => d.id === id);
export const methodById = (id) => METHODS.find((m) => m.id === id);

const SQUAD_SHARE = 0.7; // share of booked revenue that goes on the squad

export function formatMoney(m) {
  if (!Number.isFinite(m)) return '£∞';
  const abs = Math.abs(m);
  const sign = m < 0 ? '-' : '';
  if (abs >= 1000) return `${sign}£${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}bn`;
  if (abs >= 1) return `${sign}£${abs.toFixed(abs >= 100 ? 0 : 1).replace(/\.0$/, '')}m`;
  if (abs >= 0.001) return `${sign}£${Math.round(abs * 1000)}k`;
  return `${sign}£${Math.round(abs * 1e6)}`;
}

export function methodMax(method, div) {
  if (method.kind === 'ebt') return div.scale * 50;
  return div.scale * (method.kind === 'recurring' ? 80 : 30);
}

export function newGame({ owner, title, state, holdco, divisionId, clubIndex }) {
  const div = divisionById(divisionId);
  const club = CLUBS[divisionId][clubIndex];
  return {
    owner, title, state, holdco,
    club: { name: club.name, nick: club.nick, revFactor: club.revFactor },
    purchasePrice: club.price,
    tier: div.tier,
    startTier: div.tier,
    strength: club.strength,
    brand: 1, // genuine commercial pull; grows with success, drives fair market value
    deals: { sponsor: 0, partners: 0 }, // recurring annual related-party revenue
    security: 25, // cyber security posture, 0-100
    breachesSurvived: 0,
    dataLeaked: false,
    coverLevel: 0, // obstruction / non-cooperation, 0-100
    obstructionUsed: false,
    taxExposure: 0,   // unpaid tax built up by the EBT scheme
    hmrcCases: [],    // separate investigations by the taxman
    taxBillsPaid: 0,
    deferredLoss: 0,  // FFP losses pushed into the future by amortisation
    amortiseUsed: false,
    embargo: 0,       // seasons of transfer embargo remaining (from banned methods)
    tpoUsed: false,
    refInfluence: 0,  // referee influence, 0-100 (decays each season)
    refUsed: false,
    matchFixingScandal: false,
    liquidated: false,
    suspicion: 0,
    season: 1,
    lossHistory: [],
    stadiumSold: false,
    fundSpent: club.price,
    legalFees: 0,
    cases: [],
    history: [],
    trophies: 0,
    promotions: 0,
    relegations: 0,
    penalties: [],
    over: false,
  };
}

// Revenue the club would earn with no help from you.
export const genuineRevenue = (game) => divisionByTier(game.tier).baseRevenue * game.club.revFactor * game.brand;

// The most a related party could plausibly pay, given the club's genuine size.
export const methodCap = (method, game) =>
  method.capX === Infinity ? Infinity : method.capX * genuineRevenue(game);

const unit = (div) => div.scale * 15;

export function methodSuspicion(method, amount, game) {
  if (amount <= 0 || method.risk === 0) return 0;
  const div = divisionByTier(game.tier);
  const k = method.risk * div.scrutiny * 20 / unit(div);
  if (method.kind === 'offbook') return k * amount;
  const cap = methodCap(method, game);
  const within = Math.min(amount, cap);
  const over = Math.max(0, amount - cap);
  // Recurring deals within fair value are mostly defensible; one-off sales less so.
  return method.kind === 'recurring' ? k * (within * 0.15 + over * 1.2) : k * (within + over * 3);
}

// Rating used for badges and the Playbook matrix: suspicion from a "typical" use.
export function rattleRating(method, div) {
  const base = method.kind === 'recurring' ? 0.5 : 1;
  const s = method.risk * div.scrutiny * 20 * base;
  if (s === 0) return { label: 'Invisible', level: 0 };
  if (s < 8) return { label: 'Low', level: 1 };
  if (s < 18) return { label: 'Medium', level: 2 };
  if (s < 35) return { label: 'High', level: 3 };
  return { label: 'Basically confessing', level: 4 };
}

export const investigationChance = (s) => clamp(Math.pow(clamp(s, 0, 100) / 100, 1.5), 0, 0.95);

// --- cyber security side mission -------------------------------------------
export const securityMax = (div) => div.scale * 6;
const postureFromSpend = (spend, div) => 40 * (1 - Math.exp(-spend / (div.scale * 2)));
export const projectedSecurity = (game, spend) =>
  clamp(game.security * 0.8 + postureFromSpend(Math.max(0, spend || 0), divisionByTier(game.tier)), 0, 100);
// Chance an incident starts this season. Even a well-run club gets phished occasionally.
export const breachChance = (security) => clamp(0.3 * (1 - security / 100) + 0.04, 0.03, 0.4);
// How damaging a leak is: the share of your operation that is state money rather than genuine income.
export function exposure(game, { related = 0, oneoff = 0, offbook = 0, genuine = genuineRevenue(game) } = {}) {
  const fake = related + oneoff + offbook;
  return fake <= 0 ? 0 : clamp(fake / (genuine + fake), 0, 1);
}
export const vectorById = (id) => BREACH_VECTORS.find((v) => v.id === id);
export const responseById = (id) => RESPONSES.find((r) => r.id === id);

// --- obstruction / non-cooperation side mission ----------------------------
export const obstructionById = (id) => OBSTRUCTIONS.find((o) => o.id === id);

// Preview the effect of deploying a set of obstruction tactics before next season.
export function previewObstruction(game, ids) {
  const div = divisionByTier(game.tier);
  const chosen = (ids || []).map(obstructionById).filter(Boolean);
  const gain = chosen.reduce((a, o) => a + o.coverGain, 0);
  const cost = chosen.reduce((a, o) => a + o.costX, 0) * div.scale;
  const projCover = clamp(game.coverLevel * 0.85 + gain, 0, 100);
  const risky = chosen.some((o) => o.risky);
  return {
    chosen, cost, projectedCover: projCover,
    chargeReduction: projCover / 250,            // up to ~40% fewer charges stick
    extraDelay: Math.floor(projCover / 25),      // extra seasons before a verdict
    standingSuspicion: Math.round(projCover / 12), // stonewalling looks bad every season
    nonCoopRisk: clamp(projCover / 300 + (risky ? 0.12 : 0), 0, 0.5),
  };
}

// Deploy obstruction tactics for the coming season. Pure; returns a new game.
export function applyObstruction(prev, ids) {
  const game = structuredClone(prev);
  const p = previewObstruction(game, ids);
  game.coverLevel = p.projectedCover;
  game.fundSpent += p.cost;
  game.legalFees += p.cost;
  if (p.chosen.length) game.obstructionUsed = true;
  return game;
}

export const rivalRevenue = (rival, season) => rival.revenue * Math.pow(1 + RIVAL_GROWTH, season - 1);

export function moneyLeague(revenue, season) {
  const rows = MONEY_LEAGUE.map((r) => ({ name: r.name, revenue: rivalRevenue(r, season), you: false }));
  rows.push({ name: 'You', revenue, you: true });
  rows.sort((a, b) => b.revenue - a.revenue);
  return { rows, rank: rows.findIndex((r) => r.you) + 1 };
}

// Default slider values: recurring deals carry over from last season.
export function defaultAlloc(game) {
  return Object.fromEntries(METHODS.map((m) => [m.id, m.kind === 'recurring' ? game.deals[m.id] || 0 : 0]));
}

export function previewSeason(game, alloc) {
  const div = divisionByTier(game.tier);
  const genuine = genuineRevenue(game);
  let related = 0; let oneoff = 0; let equity = 0; let offbook = 0; let susp = 0;
  const overCap = [];
  for (const m of METHODS) {
    let amt = Math.max(0, alloc[m.id] || 0);
    if (m.once && game.stadiumSold) amt = 0;
    if (!amt) continue;
    if (m.kind === 'recurring') related += amt;
    else if (m.kind === 'oneoff') oneoff += amt;
    else if (m.kind === 'equity') equity += amt;
    else offbook += amt;
    susp += methodSuspicion(m, amt, game);
    if (amt > methodCap(m, game)) overCap.push(m.id);
  }
  const secSpend = Math.max(0, alloc.security || 0);
  const ebtSpend = Math.max(0, alloc.ebt || 0); // wages routed through the trust
  const refSpend = Math.max(0, alloc.ref || 0); // "unconnected" referee hospitality
  const amortise = !!alloc.amortise;
  const booked = genuine + related + oneoff;
  // EBT and off-book money both buy squad strength without touching the FFP books.
  const squadSpend = booked * SQUAD_SHARE + equity + offbook + ebtSpend;
  const typical = div.baseRevenue * SQUAD_SHARE;
  const target = 50 + 15 * Math.log2(Math.max(squadSpend, 1e-6) / typical);
  // Security spend is a legitimate operating cost, so it counts towards the loss limit.
  // Amortisation lets you defer half of this season's loss into a growing pile.
  const rawLoss = equity + secSpend;
  const deferredNow = amortise ? rawLoss * 0.5 : 0;
  const lossThisSeason = rawLoss - deferredNow;
  const recent = [...game.lossHistory.slice(-2), lossThisSeason];
  const rollingLoss = recent.reduce((a, b) => a + b, 0);
  const rollingLimit = div.lossLimit * 3;
  const projSusp = clamp(game.suspicion * 0.8 + susp, 0, 100);
  const projSecurity = projectedSecurity(game, secSpend);
  const taxAccrued = ebtSpend * EBT.taxRate;
  const projTaxExposure = game.taxExposure + taxAccrued;
  return {
    genuine, related, oneoff, equity, offbook, booked, squadSpend,
    stateMoney: related + oneoff + equity + offbook + ebtSpend,
    secSpend, ebtSpend, amortise, deferredNow, lossThisSeason,
    projectedSecurity: projSecurity,
    breachChance: breachChance(projSecurity),
    exposure: exposure(game, { related, oneoff, offbook, genuine }),
    taxAccrued, projectedTaxExposure: projTaxExposure,
    hmrcChance: hmrcChance(projTaxExposure, genuine),
    refSpend, projectedInfluence: projectedInfluence(game, refSpend),
    matchFixingRisk: matchFixingRisk(projectedInfluence(game, refSpend)),
    addedSuspicion: susp,
    projectedSuspicion: projSusp,
    investigationChance: investigationChance(projSusp),
    projectedStrength: clamp(game.strength * 0.4 + clamp(target, 5, 99) * 0.6, 5, 99),
    rollingLoss, rollingLimit,
    breachesLossLimit: rollingLoss > rollingLimit,
    overCap,
    league: moneyLeague(booked, game.season),
  };
}

// --- the taxman (HMRC): a second, separate enforcer ------------------------
// Slow to move, but its case is near-unwinnable and its bill can liquidate you.
export function hmrcChance(taxExposure, genuine) {
  if (taxExposure <= 0) return 0;
  return clamp(0.12 * (taxExposure / (genuine + taxExposure)) + taxExposure / 4000, 0.02, 0.5);
}
export const hmrcBill = (taxExposure) => taxExposure * HMRC.billMultiplier;
export const wouldLiquidate = (taxExposure, genuine) => hmrcBill(taxExposure) > genuine * HMRC.liquidationRatio;

// --- nobble the officials --------------------------------------------------
export const refMax = (div) => div.scale * 8;
export function projectedInfluence(game, refSpend) {
  const div = divisionByTier(game.tier);
  const gain = 45 * (1 - Math.exp(-Math.max(0, refSpend || 0) / (div.scale * 3)));
  return clamp(game.refInfluence * REFEREES.decay + gain, 0, REFEREES.maxInfluence);
}
// Favourable decisions worth up to ~3 league places at full influence.
export const refPlaceBonus = (influence) => Math.round(influence / 32);
// Match-fixing is the gravest charge: a small but real chance of a Calciopoli.
export const matchFixingRisk = (influence) => influence <= 0 ? 0 : clamp(influence / 350, 0, 0.3);

function finishPosition(strength, div, rng) {
  const n = div.teams;
  const noise = (rng() - 0.5) * 6;
  return clamp(Math.round(n / 2 + 0.5 - ((strength - 50) * n) / 44 + noise), 1, n);
}

function pickEvents(tier, rng) {
  const pool = EVENTS.filter((e) => tier >= (e.minTier ?? 1) && tier <= (e.maxTier ?? 99));
  const count = rng() < 0.5 ? 1 : 2;
  const picked = [];
  while (picked.length < count && pool.length) picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return picked;
}

function verdictFor(c, rng) {
  const lawyer = LAWYERS.find((l) => l.id === c.lawyer);
  const timeBarred = lawyer.delay >= 4 ? Math.round(c.charges * 0.3) : 0;
  const remaining = c.charges - timeBarred;
  const guilty = rng() < clamp(c.suspicionAtCharge / 100 + 0.2 - lawyer.defence, 0.05, 0.95);
  if (!guilty) return { guilty: false, timeBarred, remaining, sanction: 'none' };
  if (remaining < 20) return { guilty: true, timeBarred, remaining, sanction: 'fine' };
  if (remaining < 60) return { guilty: true, timeBarred, remaining, sanction: 'points', points: Math.round(remaining / 3) };
  return { guilty: true, timeBarred, remaining, sanction: 'relegation' };
}

// Genuine brand growth from on-pitch success. This is what lets fair market value rise.
function brandGain(pos, div, movement) {
  if (div.tier === 1) {
    if (pos === 1) return 0.35;
    if (pos <= 4) return 0.18;
    if (pos <= div.teams / 2) return 0.1;
    return 0.03;
  }
  if (movement === 'promoted' || movement === 'playoffs') return 0.1;
  return pos <= div.teams / 2 ? 0.03 : 0;
}

export function playSeason(prev, alloc, rng = Math.random) {
  const game = structuredClone(prev);
  const div = divisionByTier(game.tier);
  const p = previewSeason(game, alloc);
  const report = {
    season: game.season, division: div.name, regulator: div.regulator,
    revenue: p.booked, genuine: p.genuine, stateMoney: p.stateMoney,
    moneyRank: p.league.rank, events: [], news: [], position: 0, teams: div.teams,
    movement: null, newCase: null, verdicts: [], pointsDeducted: 0,
    exposure: p.exposure, breach: null, newHmrc: null, hmrcVerdicts: [],
    taxExposure: p.projectedTaxExposure, deferredLoss: game.deferredLoss + p.deferredNow,
    refInfluence: p.projectedInfluence, integrityScandal: false,
  };

  if ((alloc.stadium || 0) > 0 && !game.stadiumSold) game.stadiumSold = true;
  for (const m of METHODS) if (m.kind === 'recurring') game.deals[m.id] = Math.max(0, alloc[m.id] || 0);
  game.fundSpent += p.stateMoney + p.secSpend;
  game.lossHistory.push(p.lossThisSeason);
  game.security = p.projectedSecurity;
  game.strength = p.projectedStrength;
  game.suspicion = p.projectedSuspicion;
  game.taxExposure = p.projectedTaxExposure;
  game.fundSpent += p.refSpend; // hospitality, paid by an "unconnected" company
  game.refInfluence = p.projectedInfluence;
  if (p.refSpend > 0) game.refUsed = true;
  if (p.amortise) { game.deferredLoss += p.deferredNow; game.amortiseUsed = true; }
  if ((alloc.tpo || 0) > 0) game.tpoUsed = true;

  // Bought referees leave a trail: a standing integrity risk the regulator can smell.
  if (game.refInfluence > 0) game.suspicion = clamp(game.suspicion + Math.round(game.refInfluence / 16), 0, 100);

  // A transfer embargo (from banned methods) saps squad strength while it lasts.
  if (game.embargo > 0) {
    game.strength = clamp(game.strength - 10, 5, 99);
    game.embargo -= 1;
    report.news.push('Transfer embargo in effect: you cannot register new players. The squad weakens.');
  }

  // Third-party ownership is banned: using it risks a FIFA embargo.
  if ((alloc.tpo || 0) > 0 && rng() < 0.3) {
    game.embargo = 2;
    game.suspicion = clamp(game.suspicion + 8, 0, 100);
    report.news.push('FIFA: third-party ownership of players is prohibited. A two-season transfer embargo is imposed.');
  }
  // Inflated agent fees can surface in an exposé.
  if ((alloc.bungs || 0) > 0 && rng() < 0.25) {
    game.suspicion = clamp(game.suspicion + 10, 0, 100);
    report.news.push('An undercover documentary airs footage of your agent meetings. Questions are asked in Parliament, and by the regulator.');
  }

  // Scandals only stick if there is something to find.
  const stickiness = clamp(0.2 + p.addedSuspicion / 15, 0.2, 1);
  for (const e of pickEvents(game.tier, rng)) {
    report.events.push(e.text);
    const ds = e.susp || 0;
    game.suspicion = clamp(game.suspicion + (ds > 0 ? ds * stickiness : ds), 0, 100);
    game.strength = clamp(game.strength + (e.strength || 0), 0, 99);
  }

  // Stonewalling is itself suspicious, and can tip into a non-cooperation story.
  if (game.coverLevel > 0) {
    game.suspicion = clamp(game.suspicion + Math.round(game.coverLevel / 12), 0, 100);
    if (rng() < clamp(game.coverLevel / 300, 0, 0.4)) {
      report.news.push(`${div.regulator}: the club’s "comprehensive cooperation" turns out to be 40,000 unsearchable scans and a server that fell off a yacht. Non-cooperation is noted — and is itself a charge.`);
      game.suspicion = clamp(game.suspicion + 12, 0, 100);
      for (const c of game.cases) if (!c.resolved) c.charges += 5;
    }
  }

  if (p.breachesLossLimit) {
    report.pointsDeducted += div.ptsPenalty;
    report.news.push(`${div.regulator}: owner-funded losses of ${formatMoney(p.rollingLoss)} over three seasons exceed the ${formatMoney(p.rollingLimit)} limit. ${div.ptsPenalty}-point deduction. You spent more than you earned. That’s the one rule.`);
    game.penalties.push(`${div.ptsPenalty}-point deduction for breaching the loss limit (season ${game.season})`);
    game.lossHistory = game.lossHistory.map(() => 0);
  }

  // Amortisation was legal when you did it, but the rule-makers can cap it retroactively.
  if (game.deferredLoss > 0 && rng() < clamp(0.1 + game.season * 0.02, 0, 0.5)) {
    report.pointsDeducted += div.ptsPenalty;
    report.news.push(`Rule change: the accounting period for transfer fees is capped retroactively. ${formatMoney(game.deferredLoss)} of deferred losses must be booked at once — an instant breach. ${div.ptsPenalty}-point deduction.`);
    game.penalties.push(`${div.ptsPenalty}-point deduction when deferred (amortised) losses were clawed back`);
    game.deferredLoss = 0;
  }

  // The taxman's verdict on an EBT scheme (slow, but near-unwinnable).
  for (const hc of game.hmrcCases) {
    if (hc.resolved || hc.dueSeason !== game.season) continue;
    hc.resolved = true;
    if (rng() < 0.15) {
      report.hmrcVerdicts.push({ won: true, bill: hc.bill });
      report.news.push('HMRC: against the odds, the tribunal accepts a technical defence. No bill falls due this time.');
    } else {
      game.taxBillsPaid += hc.bill;
      game.fundSpent += hc.bill;
      game.taxExposure = Math.max(0, game.taxExposure - hc.covered);
      report.hmrcVerdicts.push({ won: false, bill: hc.bill, liquidate: hc.liquidate });
      if (hc.liquidate) applyLiquidation(game, report, hc.bill);
      else {
        game.penalties.push(`HMRC back-tax, penalties and interest: ${formatMoney(hc.bill)}`);
        report.news.push(`HMRC: the Employee Benefit Trust scheme is ruled unlawful. The bill for back-tax, penalties and interest is ${formatMoney(hc.bill)}. Painful, but survivable — this time.`);
      }
    }
  }

  for (const c of game.cases) {
    if (c.resolved || c.verdictSeason !== game.season) continue;
    c.resolved = true;
    const v = verdictFor(c, rng);
    report.verdicts.push({ ...v, charges: c.charges });
    if (v.guilty) {
      // Inflated deals get restated to fair value.
      for (const m of METHODS) if (m.kind === 'recurring') game.deals[m.id] = Math.min(game.deals[m.id], methodCap(m, game));
    }
    if (v.sanction === 'fine') game.penalties.push(`Fined after ${v.remaining} proven breaches`);
    else if (v.sanction === 'points') {
      report.pointsDeducted += v.points;
      game.penalties.push(`${v.points}-point deduction after ${v.remaining} proven breaches`);
    } else if (v.sanction === 'relegation') {
      report.forcedRelegation = true;
      game.penalties.push(`Expelled one division after ${v.remaining} proven breaches`);
    }
    if (!v.guilty) game.suspicion = clamp(game.suspicion - 30, 0, 100);
  }

  // Match-fixing is the gravest charge. When it lands, it's Calciopoli: titles
  // stripped and relegation, no lawyers, no appeal that helps.
  if (game.refInfluence > 0 && rng() < matchFixingRisk(game.refInfluence)) {
    game.matchFixingScandal = true;
    report.integrityScandal = true;
    report.forcedRelegation = true;
    const stripped = game.trophies > 0;
    if (stripped) game.trophies -= 1;
    game.suspicion = clamp(game.suspicion + 25, 0, 100);
    game.refInfluence = 0;
    game.penalties.push(`Match-fixing proven: ${stripped ? 'a title stripped and ' : ''}expelled a division (Calciopoli-style)`);
    report.news.push(`INTEGRITY SCANDAL: an inquiry proves the referee "seminars" were anything but unconnected. ${stripped ? 'A title is stripped and the ' : 'The '}club is expelled a division. This is what happened to Juventus in 2006.`);
  }

  let pos = finishPosition(game.strength, div, rng);
  // Favourable decisions from nobbled referees nudge you up the table.
  pos = clamp(pos - refPlaceBonus(game.refInfluence), 1, div.teams);
  if (game.refInfluence > 25 && !report.integrityScandal && rng() < 0.4) {
    report.events.push('A 96th-minute penalty the replays can’t justify sinks your nearest rivals. The referee looks very tanned.');
  }
  pos = clamp(pos + Math.round(report.pointsDeducted / 3), 1, div.teams);
  report.position = pos;

  const bottomTier = DIVISIONS[DIVISIONS.length - 1].tier;
  if (report.forcedRelegation && game.tier < bottomTier) report.movement = 'expelled';
  else if (pos === 1 && game.tier === 1) report.movement = 'champions';
  else if (pos <= 2 && game.tier > 1) report.movement = 'promoted';
  else if (pos <= 6 && game.tier > 1 && rng() < 0.3) report.movement = 'playoffs';
  else if (pos > div.teams - 3 && game.tier < bottomTier) report.movement = 'relegated';
  if (pos === 1) game.trophies += 1;

  game.brand += brandGain(pos, div, report.movement);
  if (report.movement === 'promoted' || report.movement === 'playoffs') {
    game.tier -= 1; game.promotions += 1;
    game.strength = clamp(game.strength - 18, 20, 99);
  } else if (report.movement === 'relegated' || report.movement === 'expelled') {
    game.tier += 1; game.relegations += 1;
    game.strength = clamp(game.strength + 18, 0, 85);
    game.brand = Math.max(1, game.brand - 0.15);
  }

  const open = game.cases.some((c) => !c.resolved);
  if (!open && rng() < investigationChance(game.suspicion)) {
    // Obstruction means they can gather less, so fewer charges actually stick.
    const charges = Math.max(1, Math.round(game.suspicion * 1.15 * (1 - game.coverLevel / 250)));
    report.newCase = { charges, regulator: div.regulator };
  }

  // Cyber incident roll. Resolved by the player via resolveBreach() before the season ends.
  if (rng() < breachChance(game.security)) {
    report.breach = { vectorId: BREACH_VECTORS[Math.floor(rng() * BREACH_VECTORS.length)].id, resolved: false };
  }

  // The taxman opens a case. Separate from football; slow; resolved by resolveHmrc().
  const hmrcOpen = game.hmrcCases.some((c) => !c.resolved);
  if (!hmrcOpen && !game.liquidated && rng() < hmrcChance(game.taxExposure, p.genuine)) {
    report.newHmrc = {
      exposure: game.taxExposure,
      bill: hmrcBill(game.taxExposure),
      liquidate: wouldLiquidate(game.taxExposure, p.genuine),
    };
  }

  report.strength = game.strength;
  report.suspicion = game.suspicion;
  game.history.push(report);
  game.season += 1;
  // The season isn't "over" while a decision (charge, breach, taxman) is still waiting on the player.
  if (game.season > SEASONS && !report.newCase && !report.breach && !report.newHmrc) game.over = true;
  return { game, report };
}

function applyLiquidation(game, report, bill) {
  game.liquidated = true;
  report.liquidation = true;
  const bottom = DIVISIONS[DIVISIONS.length - 1].tier;
  const from = game.tier;
  game.tier = Math.min(bottom, game.tier + 4);
  game.relegations += 1;
  game.strength = clamp(game.strength - 25, 5, 60);
  game.brand = 1;
  game.deals = { sponsor: 0, partners: 0 };
  game.taxExposure = 0;
  game.deferredLoss = 0;
  game.penalties.push(`Liquidated over an unpayable ${formatMoney(bill)} tax bill; reformed ${game.tier - from} division(s) lower`);
  report.news.push(`INSOLVENCY: the club cannot pay the ${formatMoney(bill)} bill. The company is liquidated and the club is reformed in a far lower division. This is exactly what happened to Rangers in 2012.`);
}

// The player's response to a taxman's case. Pure; returns a new game.
export function resolveHmrc(prev, choice, rng = Math.random) {
  const game = structuredClone(prev);
  const report = game.history[game.history.length - 1];
  const nh = report.newHmrc;
  report.newHmrc = { ...nh, resolved: true, choice };
  if (choice === 'settle') {
    // Pay a reduced bill now, with certainty, and wipe the slate.
    const bill = nh.bill * 0.6;
    game.taxBillsPaid += bill;
    game.fundSpent += bill;
    game.taxExposure = 0;
    game.penalties.push(`Settled with HMRC for ${formatMoney(bill)}`);
    report.hmrcSettlement = bill;
  } else {
    // Fight it. Long delay (more time), but the scheme is near-impossible to defend.
    const delay = HMRC.caseDelayMin + Math.floor(rng() * (HMRC.caseDelayMax - HMRC.caseDelayMin + 1));
    game.hmrcCases.push({
      covered: nh.exposure, bill: nh.bill, liquidate: nh.liquidate,
      seasonCharged: report.season, dueSeason: report.season + delay, resolved: false,
    });
  }
  if (game.season > SEASONS) game.over = true;
  return game;
}

// Resolve a cyber incident. Returns { game, outcome } where outcome drives the UI.
export function resolveBreach(prev, responseId, rng = Math.random) {
  const game = structuredClone(prev);
  const report = game.history[game.history.length - 1];
  const vector = vectorById(report.breach.vectorId);
  const response = responseById(responseId);
  const div = divisionByTier(game.tier);

  // How much of the at-risk data still gets out, after security posture and your response.
  let leaked = clamp(vector.severity * (1 - game.security / 100) * response.containment * (0.6 + rng() * 0.8), 0, 1);
  let backfired = false;
  if (response.risky && rng() < 0.4) { // the attackers take the money and leak anyway
    leaked = Math.max(leaked, vector.severity * 0.9);
    backfired = true;
  }

  // The leak reveals your accounts. Suspicion added scales with how dirty the operation is.
  const fromLeak = leaked * report.exposure * 55;
  const fromPress = leaked * 6 + (backfired ? 10 : 0); // even a clean club gets bad headlines
  const added = Math.round(fromLeak + fromPress);
  game.suspicion = clamp(game.suspicion + added, 0, 100);

  const cost = response.costX * div.scale;
  game.legalFees += cost; // folded into "incident & legal" costs
  game.fundSpent += cost;
  game.security = clamp(game.security + response.postureGain, 0, 100);
  if (leaked > 0.5) game.dataLeaked = true;
  else game.breachesSurvived += 1;

  report.breach.resolved = true;
  report.breach.leaked = leaked;
  report.breach.added = added;
  report.breach.response = responseId;
  report.breach.backfired = backfired;

  if (game.season > SEASONS && !report.newCase) game.over = true;
  return {
    game,
    outcome: { vector, response, leaked, added, cost, backfired, exposure: report.exposure },
  };
}

export function hireLawyers(prev, lawyerId) {
  const game = structuredClone(prev);
  const report = game.history[game.history.length - 1];
  const lawyer = LAWYERS.find((l) => l.id === lawyerId);
  const fee = lawyer.costX * divisionByTier(game.tier).scale;
  game.legalFees += fee;
  game.fundSpent += fee;
  game.cases.push({
    charges: report.newCase.charges,
    seasonCharged: report.season,
    // Obstruction drags the process out, giving more time for charges to be time-barred.
    verdictSeason: report.season + lawyer.delay + Math.floor(game.coverLevel / 25),
    lawyer: lawyerId,
    suspicionAtCharge: game.suspicion,
    resolved: false,
  });
  if (game.season > SEASONS) game.over = true;
  return game;
}

export const lastReport = (game) => game.history[game.history.length - 1];

export function finalScore(game) {
  const last = lastReport(game);
  let score = game.trophies * 150 + game.promotions * 100 - game.relegations * 80;
  score += (game.startTier - game.tier) * 50 - game.penalties.length * 60;
  if (game.tier === 1) score += 200;
  if (game.liquidated) score -= 300;
  if (game.matchFixingScandal) score -= 250;
  if (last) score += Math.max(0, MONEY_LEAGUE.length + 2 - last.moneyRank) * 60;
  return Math.round(score);
}

export function endingTitle(game) {
  const last = lastReport(game);
  const pending = game.cases.filter((c) => !c.resolved);
  const taxPending = game.hmrcCases.filter((c) => !c.resolved);
  if (game.liquidated) return { title: 'Done a Rangers', blurb: 'The taxman got his money the only way left: by liquidating the club. You are starting again several divisions down. The trophies, awkwardly, stay in the cabinet.' };
  if (game.matchFixingScandal) return { title: 'Calciopoli', blurb: 'The referee "seminars" were anything but unconnected. A title stripped, an expulsion, and an asterisk next to everything you ever won. The one line even football won’t let you cross.' };
  if (taxPending.length) return { title: 'The Taxman Cometh', blurb: `You beat football’s regulators, but HMRC’s case lands in season ${taxPending[0].dueSeason}, and the courts rarely side with a "loan" nobody repaid.` };
  if (game.penalties.some((p) => p.startsWith('Expelled'))) return { title: 'Caught Red-Handed', blurb: 'The regulator actually did it. Somewhere, a pundit is still saying "they earned it".' };
  if (last?.moneyRank === 1 && pending.length) return { title: 'Richest Club on Earth (Allegedly)', blurb: `You out-earned Real Madreeed. The verdict on how is due in season ${pending[0].verdictSeason}. Until then you are, technically, a commercial genius.` };
  if (last?.moneyRank === 1) return { title: 'Richest Club on Earth', blurb: 'From nowhere to the top of the Money League. Deloitte sends a fruit basket. The fruit is from your state.' };
  if (pending.length) return { title: 'Still Under Investigation', blurb: `The verdict is due in season ${pending[0].verdictSeason}, roughly when your grandchildren take over.` };
  if (game.tier === 1 && game.trophies > 0) return { title: 'Sportswashed Squeaky Clean', blurb: 'Silverware, a gleaming reputation and a documentary series. The accounts are "complex".' };
  if (game.tier === 1) return { title: 'Premier League Plaything', blurb: 'You made it to the top table. Nobody has asked the awkward questions. Yet.' };
  if (game.tier < game.startTier) return { title: 'Upwardly Mobile Oligarch', blurb: 'You climbed the pyramid. The pyramid has questions.' };
  if (game.penalties.length) return { title: 'Gloriously Incompetent', blurb: 'You spent a fortune, got caught and went nowhere. Truly a modern football owner.' };
  return { title: 'Suspiciously Responsible', blurb: 'You ran the club sensibly. Your state’s ministry of sport is very disappointed.' };
}

export const fundShare = (game) => game.fundSpent / FUND;

export { SEASONS };
