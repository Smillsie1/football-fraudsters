// UI layer. Security rule: never use innerHTML. All text goes through textContent via h().
import { DIVISIONS, CLUBS, METHODS, LAWYERS, RESPONSES, BREACH_VECTORS, OBSTRUCTIONS, EBT, AMORTISATION, HMRC, REFEREES, STATES, TITLES, RULES_EXPLAINER, BLUEPRINT, SEASONS, FUND } from './data.js';
import {
  newGame, previewSeason, playSeason, hireLawyers, resolveBreach, resolveHmrc, formatMoney, methodMax, methodCap,
  rattleRating, divisionByTier, finalScore, endingTitle, genuineRevenue, defaultAlloc,
  moneyLeague, fundShare, lastReport, securityMax, vectorById, responseById,
  applyObstruction, previewObstruction, refMax,
} from './engine.js';

const app = document.getElementById('app');
let game = null;
let setup = {};

// --- tiny DOM helper -------------------------------------------------------
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function render(...nodes) {
  app.replaceChildren(...nodes);
  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const clean = (s, max) => String(s || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
const pct = (x) => `${Math.round(x * 100)}%`;
const pctFine = (x) => `${(x * 100).toFixed(x < 0.01 ? 3 : 1)}%`;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');

function meter(label, value, max = 100, tone = '', display = Math.round(value)) {
  const bar = h('span', { class: `meter-fill ${tone}` });
  bar.style.width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  return h('div', { class: 'meter' },
    h('div', { class: 'meter-label' }, h('span', {}, label), h('strong', {}, display)),
    h('div', { class: 'meter-track', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': String(Math.round(max)), 'aria-valuenow': String(Math.round(value)), 'aria-label': label }, bar));
}

const riskBadge = (r) => h('span', { class: `badge risk-${r.level}` }, r.label);

function moneyTable(league, limit = 6) {
  const youIdx = league.rows.findIndex((r) => r.you);
  const rows = league.rows.filter((r, i) => i < limit || i === youIdx);
  return h('table', { class: 'money' },
    h('caption', {}, 'Football Money League'),
    h('tbody', {}, rows.map((r) => h('tr', { class: r.you ? 'you' : '' },
      h('td', {}, String(league.rows.indexOf(r) + 1)),
      h('th', { scope: 'row' }, r.you ? game.club.name : r.name),
      h('td', { class: 'num' }, formatMoney(r.revenue))))));
}

// --- screens ---------------------------------------------------------------
function screenIntro() {
  render(h('section', { class: 'hero' },
    h('p', { class: 'kicker' }, '115 Problems Edition'),
    h('h1', {}, 'Sportswash ', h('em', {}, '&'), ' Go'),
    h('p', { class: 'lede' }, 'Fantasy football for people with a sovereign wealth fund. Buy any club in the English pyramid, from the Premier League down to the Dog & Duck.'),
    h('p', { class: 'lede' }, 'One snag: financial fair play says you can only spend what you earn. So your job is to make your money look earned, and turn a nobody into the highest-earning club on the planet within 10 seasons.'),
    h('div', { class: 'hero-actions' },
      h('button', { class: 'primary big', onclick: screenSetup }, 'Begin hostile takeover'),
      h('button', { class: 'ghost big', onclick: openPlaybook }, 'Read the Playbook first')),
    h('ul', { class: 'pill-list' },
      h('li', {}, `${DIVISIONS.length} divisions`),
      h('li', {}, `${METHODS.length} ways to move money`),
      h('li', {}, `${SEASONS} seasons`),
      h('li', {}, `${formatMoney(FUND)} pocket money`),
      h('li', {}, '0 convictions (so far)'))));
}

function screenSetup() {
  const nameIn = h('input', { id: 'owner', name: 'owner', required: true, maxlength: '40', autocomplete: 'off', placeholder: 'e.g. Sheikh Rattle-and-Roll' });
  const titleSel = h('select', { id: 'title', name: 'title' }, TITLES.map((t) => h('option', { value: t }, t)));
  const stateSel = h('select', { id: 'state', name: 'state' }, STATES.map((s) => h('option', { value: s }, s)));
  const holdIn = h('input', { id: 'holdco', name: 'holdco', maxlength: '60', autocomplete: 'off', value: 'Entirely Separate Holdings LLP' });
  const err = h('p', { class: 'error', role: 'alert' });

  const form = h('form', {
    class: 'card form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      const owner = clean(nameIn.value, 40);
      if (!owner) { err.textContent = 'Even shadowy figures need a name.'; nameIn.focus(); return; }
      setup = {
        owner,
        title: TITLES.includes(titleSel.value) ? titleSel.value : TITLES[0],
        state: STATES.includes(stateSel.value) ? stateSel.value : STATES[0],
        holdco: clean(holdIn.value, 60) || 'Entirely Separate Holdings LLP',
      };
      screenDivision();
    },
  },
  h('h2', {}, 'Step 1: The paperwork'),
  h('p', { class: 'muted' }, 'This is everything the Owners’ & Directors’ Test will ever know about you.'),
  h('label', { for: 'owner' }, 'Your name'), nameIn,
  h('label', { for: 'title' }, 'Your title'), titleSel,
  h('label', { for: 'state' }, 'Your totally separate sovereign state'), stateSel,
  h('label', { for: 'holdco' }, 'Name of your (definitely independent) holding company'), holdIn,
  err,
  h('button', { class: 'primary', type: 'submit' }, 'Submit to "due diligence"'));
  render(form);
  nameIn.focus();
}

function screenDivision() {
  render(h('section', {},
    h('h2', {}, 'Step 2: Choose your rung of the pyramid'),
    h('p', { class: 'muted' }, 'Start high and you have more time to climb the Money League, but face more scrutiny. Start low and nobody is watching, but it’s a long way up.'),
    h('div', { class: 'grid' }, DIVISIONS.map((d) => h('button', {
      class: 'card choice', onclick: () => screenClub(d),
    },
    h('span', { class: 'tier' }, `Tier ${d.tier}`),
    h('strong', {}, d.name),
    h('span', { class: 'muted small' }, `Watched by: ${d.regulator}`),
    h('span', { class: 'scrutiny' }, 'Scrutiny ', '\u{1F441}️'.repeat(Math.max(1, Math.round(d.scrutiny * 3)))))))));
}

function screenClub(div) {
  render(h('section', {},
    h('button', { class: 'ghost small', onclick: screenDivision }, '← Back to divisions'),
    h('h2', {}, `Step 3: Pick your ${div.name} club`),
    h('p', { class: 'muted' }, div.rules),
    h('div', { class: 'grid' }, CLUBS[div.id].map((c, i) => h('button', {
      class: 'card choice club', onclick: () => buyClub(div, i),
    },
    h('strong', {}, c.name),
    h('span', { class: 'muted small' }, `"${c.nick}"`),
    h('span', {}, c.flavour),
    h('span', { class: 'stats' },
      h('span', {}, `Price: ${formatMoney(c.price)}`),
      h('span', {}, `Revenue: ${formatMoney(div.baseRevenue * c.revFactor)}`),
      h('span', {}, `Squad: ${c.strength}/100`)))))));
}

function buyClub(div, idx) {
  game = newGame({ ...setup, divisionId: div.id, clubIndex: idx });
  const verdicts = [
    `After receiving "legally binding assurances" that ${setup.state} and ${setup.holdco} are completely separate entities, the takeover is approved.`,
    `The Owners’ & Directors’ Test is passed. The form had a box marked "Are you a nation state?" and ${setup.holdco} ticked "Prefer not to say".`,
    `Due diligence complete. The regulator’s compliance officer has been invited to a "fact-finding trip". It has a spa.`,
  ];
  render(h('section', { class: 'card announce' },
    h('p', { class: 'kicker' }, 'BREAKING'),
    h('h2', {}, `${game.title} ${game.owner} completes ${formatMoney(game.purchasePrice)} takeover of ${game.club.name}`),
    h('p', {}, pick(verdicts)),
    h('p', { class: 'muted' }, `That’s ${pctFine(game.purchasePrice / FUND)} of your fund. Fans gather outside the ground holding ${setup.state} flags they were handed on the way in.`),
    h('p', {}, `Your mission: ${game.club.name} earns ${formatMoney(genuineRevenue(game))} a year. Real Madreeed earns about ${formatMoney(1000)}. You have ${SEASONS} seasons.`),
    h('button', { class: 'primary', onclick: screenSeason }, 'To the boardroom →')));
}

function statusBar(season = game.season) {
  const div = divisionByTier(game.tier);
  const openCase = game.cases.find((c) => !c.resolved);
  const taxCase = game.hmrcCases.find((c) => !c.resolved);
  return h('div', { class: 'status card' },
    h('div', {},
      h('strong', { class: 'club-name' }, game.club.name),
      h('span', { class: 'muted small' }, `${div.name} · Season ${Math.min(season, SEASONS)}/${SEASONS} · Genuine revenue ${formatMoney(genuineRevenue(game))} · Fund used ${pctFine(fundShare(game))}`)),
    meter('Squad strength', game.strength, 100, 'good'),
    meter('Regulator suspicion', game.suspicion, 100, 'bad'),
    meter('Cyber security', game.security, 100, 'cyber'),
    openCase ? h('p', { class: 'case-flag' }, `⚖️ ${openCase.charges} charges pending. Verdict due season ${openCase.verdictSeason}.`) : null,
    taxCase ? h('p', { class: 'case-flag' }, `\u{1F3DB}️ HMRC case: ${formatMoney(taxCase.bill)} bill, verdict due season ${taxCase.dueSeason}.`) : null,
    (game.taxExposure > 0 && !taxCase) ? h('p', { class: 'muted small' }, `\u{1F3DB}️ Unpaid tax exposure: ${formatMoney(game.taxExposure)}.`) : null,
    game.refInfluence > 0 ? h('p', { class: 'muted small' }, `\u{1F6A9} Referee influence: ${Math.round(game.refInfluence)}/100.`) : null,
    game.embargo > 0 ? h('p', { class: 'case-flag' }, `\u{1F6AB} Transfer embargo: ${game.embargo} season(s) left.`) : null);
}

const GROUPS = [
  { kind: 'recurring', title: '\u{1F4C8} "Commercial" deals', note: 'Booked as revenue every season. Set the annual value: it carries over until you change it. Stay near fair market value, which rises as you win.' },
  { kind: 'oneoff', title: '\u{1F3F7}️ One-off sales', note: 'Booked as revenue this season only. A quick boost to the accounts.' },
  { kind: 'equity', title: '\u{1F610} Honest money', note: 'Invisible to regulators, but it’s a loss. Too much and FFP docks you points.' },
  { kind: 'offbook', title: '\u{1F648} Off the books', note: 'Never in the accounts, so FFP can’t see it. If anyone finds it, it’s the worst kind of breach.' },
];

function screenSeason() {
  const div = divisionByTier(game.tier);
  const alloc = defaultAlloc(game);

  const preview = h('div', { class: 'preview card' });
  const updatePreview = () => {
    const p = previewSeason(game, alloc);
    const top = p.league.rows[0];
    const lossLine = Number.isFinite(p.rollingLimit)
      ? `FFP: owner losses over 3 seasons ${formatMoney(p.rollingLoss)} of ${formatMoney(p.rollingLimit)} allowed`
      : 'FFP: no meaningful loss limit at this level';
    preview.replaceChildren(...[
      h('h3', {}, 'The accounts (as presented)'),
      h('dl', { class: 'ledger' },
        h('dt', {}, 'Genuine revenue'), h('dd', {}, formatMoney(p.genuine)),
        h('dt', {}, '"Commercial" deals'), h('dd', {}, formatMoney(p.related)),
        h('dt', {}, 'One-off sales'), h('dd', {}, formatMoney(p.oneoff)),
        h('dt', { class: 'total' }, 'Reported revenue'), h('dd', { class: 'total' }, formatMoney(p.booked)),
        h('dt', {}, 'Squad budget'), h('dd', {}, formatMoney(p.squadSpend))),
      meter(`Revenue vs ${p.league.rank === 1 ? 'nearest rival' : top.name}`, p.booked, Math.max(p.booked, p.league.rows[p.league.rank === 1 ? 1 : 0].revenue), 'gold', `${ordinal(p.league.rank)} in the world`),
      meter('Projected squad strength', p.projectedStrength, 100, 'good'),
      meter('Projected suspicion', p.projectedSuspicion, 100, 'bad'),
      meter('Projected cyber security', p.projectedSecurity, 100, 'cyber'),
      h('p', { class: p.investigationChance > 0.35 ? 'warn' : '' }, `Chance of being rattled by the ${div.regulator} this season: `, h('strong', {}, pct(p.investigationChance))),
      h('p', { class: p.breachChance > 0.2 ? 'warn' : 'muted small' }, `Chance of a cyber incident this season: `, h('strong', {}, pct(p.breachChance)), `. If data leaks, ${pct(p.exposure)} of your operation is fake and would be exposed.`),
      p.projectedTaxExposure > 0 ? h('p', { class: p.hmrcChance > 0.2 ? 'warn' : 'muted small' }, `Unpaid tax building up: `, h('strong', {}, formatMoney(p.projectedTaxExposure)), `. Chance the taxman opens a case: `, h('strong', {}, pct(p.hmrcChance)), '.') : null,
      p.projectedInfluence > 0 ? h('p', { class: p.matchFixingRisk > 0.12 ? 'warn' : 'muted small' }, `Referee influence: `, h('strong', {}, Math.round(p.projectedInfluence)), `/100 (worth up to a few league places). Chance of a match-fixing scandal: `, h('strong', {}, pct(p.matchFixingRisk)), '.') : null,
      p.deferredNow > 0 ? h('p', { class: 'muted small' }, `Deferring ${formatMoney(p.deferredNow)} of this season’s loss via amortisation (total deferred: ${formatMoney(game.deferredLoss + p.deferredNow)}).`) : null,
      h('p', { class: p.breachesLossLimit ? 'warn' : 'muted small' }, lossLine, p.breachesLossLimit ? '. BREACH: automatic points deduction!' : ''),
      p.overCap.length ? h('p', { class: 'warn small' }, `Above fair market value: ${p.overCap.map((id) => METHODS.find((m) => m.id === id).name).join(', ')}`) : null,
    ].filter(Boolean));
  };

  const card = (m) => {
    const disabled = m.once && game.stadiumSold;
    const max = methodMax(m, div);
    const cap = methodCap(m, game);
    const start = Math.min(max, alloc[m.id]);
    const valueOut = h('output', { class: `amount ${start > cap ? 'over' : ''}` }, formatMoney(start));
    const slider = h('input', {
      type: 'range', min: '0', max: String(max), step: String(max / 200), disabled,
      'aria-label': `${m.name} amount`,
      oninput: (e) => {
        const v = Math.min(max, Math.max(0, Number(e.target.value) || 0));
        alloc[m.id] = v;
        valueOut.textContent = formatMoney(v);
        valueOut.classList.toggle('over', v > cap);
        updatePreview();
      },
    });
    slider.value = String(start);
    return h('details', { class: `method card ${disabled ? 'used' : ''}` },
      h('summary', {},
        h('span', { class: 'emoji', 'aria-hidden': 'true' }, m.emoji),
        h('span', { class: 'm-name' }, m.name),
        riskBadge(rattleRating(m, div))),
      h('div', { class: 'slider-row' }, slider, valueOut),
      h('p', { class: 'muted small' },
        disabled ? 'Already used. You only have one stadium (for now).'
          : Number.isFinite(cap) ? `Fair market value: ~${formatMoney(cap)}${m.kind === 'recurring' ? ' a year' : ''}` : m.kind === 'equity' ? 'No ceiling. It’s legal.' : 'There is no "fair value" for this. Any amount is a breach.'),
      h('dl', {},
        h('dt', {}, 'How it works in theory'), h('dd', {}, m.theory),
        h('dt', {}, 'What regulators look for'), h('dd', {}, m.redFlags),
        h('dt', {}, 'Real-world precedent'), h('dd', {}, m.precedent)));
  };

  const securityCard = () => {
    const max = securityMax(div);
    const valueOut = h('output', { class: 'amount' }, formatMoney(alloc.security || 0));
    const slider = h('input', {
      type: 'range', min: '0', max: String(max), step: String(max / 200), value: String(alloc.security || 0),
      'aria-label': 'Cyber security budget',
      oninput: (e) => {
        alloc.security = Math.min(max, Math.max(0, Number(e.target.value) || 0));
        valueOut.textContent = formatMoney(alloc.security);
        updatePreview();
      },
    });
    return h('section', { class: 'group' },
      h('h3', {}, '\u{1F6E1}️ Cyber security budget'),
      h('p', { class: 'muted small' }, 'The quiet part. Your real secret is the accounts, and one phishing click can dump them online. Spend on defence to raise your security posture and cut the chance of an incident. It’s a legitimate operating cost, so it counts towards the loss limit — but it’s cheap insurance.'),
      h('details', { class: 'method card', open: true },
        h('summary', {}, h('span', { class: 'emoji', 'aria-hidden': 'true' }, '\u{1F512}'), h('span', { class: 'm-name' }, 'Defend the network'), h('span', { class: `badge risk-0` }, 'Legit')),
        h('div', { class: 'slider-row' }, slider, valueOut),
        h('p', { class: 'muted small' }, `Current posture: ${Math.round(game.security)}/100. Think staff training, multi-factor authentication, endpoint protection, encrypted laptops and network segmentation.`)));
  };

  const taxmanCard = () => {
    const max = methodMax(EBT, div);
    const ebtOut = h('output', { class: 'amount' }, formatMoney(alloc.ebt || 0));
    const ebtSlider = h('input', {
      type: 'range', min: '0', max: String(max), step: String(max / 200), value: String(alloc.ebt || 0),
      'aria-label': 'EBT wage spend',
      oninput: (e) => { alloc.ebt = Math.min(max, Math.max(0, Number(e.target.value) || 0)); ebtOut.textContent = formatMoney(alloc.ebt); updatePreview(); },
    });
    const amortCb = h('input', { type: 'checkbox', id: 'amortise-cb', checked: !!alloc.amortise,
      onchange: (e) => { alloc.amortise = e.target.checked; updatePreview(); } });
    return h('section', { class: 'group' },
      h('h3', {}, '\u{1F3DB}️ The taxman’s blind spot'),
      h('p', { class: 'muted small' }, 'The football regulator can’t see either of these. One hides wages from the tax office; the other bends the accounting rules. Both are a different kind of risk.'),
      h('details', { class: 'method card ebt', open: true },
        h('summary', {}, h('span', { class: 'emoji', 'aria-hidden': 'true' }, EBT.emoji), h('span', { class: 'm-name' }, EBT.name), h('span', { class: 'badge risk-3' }, 'HMRC risk')),
        h('div', { class: 'slider-row' }, ebtSlider, ebtOut),
        h('p', { class: 'muted small' }, `Buys squad strength cheaply and invisibly to football — but every ${formatMoney(1)} routed builds about ${formatMoney(EBT.taxRate)} of unpaid tax the taxman will eventually chase. Current exposure: ${formatMoney(game.taxExposure)}.`),
        h('dl', {},
          h('dt', {}, 'How it works in theory'), h('dd', {}, EBT.theory),
          h('dt', {}, 'What catches it'), h('dd', {}, EBT.redFlags),
          h('dt', {}, 'Real-world precedent'), h('dd', {}, EBT.precedent))),
      h('label', { class: 'method card obstruct', for: 'amortise-cb' },
        h('div', { class: 'obstruct-head' }, amortCb,
          h('span', { class: 'emoji', 'aria-hidden': 'true' }, AMORTISATION.emoji),
          h('span', { class: 'm-name' }, AMORTISATION.name),
          h('span', { class: 'badge risk-2' }, 'Legal, for now')),
        h('p', { class: 'muted small' }, AMORTISATION.theory),
        h('p', { class: 'small' }, `\u{1F4A1} ${AMORTISATION.precedent}`)));
  };

  const refereeCard = () => {
    const max = refMax(div);
    const out = h('output', { class: 'amount' }, formatMoney(alloc.ref || 0));
    const slider = h('input', {
      type: 'range', min: '0', max: String(max), step: String(max / 200), value: String(alloc.ref || 0),
      'aria-label': 'Referee hospitality spend',
      oninput: (e) => { alloc.ref = Math.min(max, Math.max(0, Number(e.target.value) || 0)); out.textContent = formatMoney(alloc.ref); updatePreview(); },
    });
    return h('section', { class: 'group' },
      h('h3', {}, '\u{1F6A9} Nobble the officials'),
      h('p', { class: 'muted small' }, 'Invisible to the accounts — and to football, until an integrity unit joins the dots. This is the line even the other cheats don’t cross.'),
      h('details', { class: 'method card ref' },
        h('summary', {}, h('span', { class: 'emoji', 'aria-hidden': 'true' }, REFEREES.emoji), h('span', { class: 'm-name' }, REFEREES.name), h('span', { class: 'badge risk-4' }, 'Match-fixing')),
        h('div', { class: 'slider-row' }, slider, out),
        h('p', { class: 'muted small' }, `Current influence: ${Math.round(game.refInfluence)}/100. Favourable 50/50s, soft penalties and marginal offsides nudge your results — but if it’s ever proven, it strips titles and relegates you.`),
        h('dl', {},
          h('dt', {}, 'How it works in theory'), h('dd', {}, REFEREES.theory),
          h('dt', {}, 'What catches it'), h('dd', {}, REFEREES.redFlags),
          h('dt', {}, 'Real-world precedent'), h('dd', {}, REFEREES.precedent))));
  };

  updatePreview();
  render(
    statusBar(),
    h('h2', {}, `Season ${game.season}: the financial year`),
    h('p', { class: 'muted' }, 'Only reported revenue unlocks spending. Tap a method to see how it works in theory and what gets people caught.'),
    h('div', { class: 'season-layout' },
      h('div', { class: 'methods' }, GROUPS.map((g) => h('section', { class: 'group' },
        h('h3', {}, g.title),
        h('p', { class: 'muted small' }, g.note),
        METHODS.filter((m) => m.kind === g.kind).map(card))).concat(taxmanCard(), refereeCard(), securityCard())),
      h('aside', {}, preview,
        h('button', { class: 'primary big full', onclick: () => {
          const res = playSeason(game, alloc);
          game = res.game;
          screenReport(res.report);
        } }, '⚽ Kick off the season'))));
}

function movementLine(r) {
  return {
    champions: '\u{1F3C6} CHAMPIONS OF ENGLAND! The trophy is presented by a minister from your state, entirely coincidentally.',
    promoted: '⬆️ PROMOTED! Bring on the next level of scrutiny.',
    playoffs: '⬆️ Promoted through the play-offs! Wembley has rarely seen so many flags handed out at the gate.',
    relegated: '⬇️ Relegated. Spending was too modest. Or too visible.',
    expelled: '\u{1F6A8} EXPELLED down a division by the commission!',
  }[r.movement] || 'Steady season. Mid-table. The worst outcome for a vanity project.';
}

function screenReport(r) {
  const parts = [
    h('h2', {}, `Season ${r.season} report: ${r.division}`),
    h('div', { class: 'card big-result' },
      h('p', { class: 'position' }, ordinal(r.position), h('span', { class: 'muted' }, ` of ${r.teams}`)),
      h('p', {}, movementLine(r)),
      r.pointsDeducted ? h('p', { class: 'warn' }, `Includes a ${r.pointsDeducted}-point deduction.`) : null,
      h('p', { class: 'muted' }, `Reported revenue ${formatMoney(r.revenue)} (${ordinal(r.moneyRank)} in the world). Genuine: ${formatMoney(r.genuine)}. State money moved this season: ${formatMoney(r.stateMoney)}.`)),
  ];
  if (r.events.length) {
    parts.push(h('div', { class: 'card' }, h('h3', {}, '\u{1F4F0} Headlines'), h('ul', {}, r.events.map((e) => h('li', {}, e)))));
  }
  if (r.news.length) {
    parts.push(h('div', { class: 'card alert' }, h('h3', {}, '\u{1F4CB} Regulator notices'), r.news.map((n) => h('p', {}, n))));
  }
  for (const v of r.verdicts) {
    const outcome = !v.guilty
      ? 'CLEARED. Your lawyers celebrate. Your fans make a banner. Rival fans make a different banner.'
      : { fine: 'GUILTY, punished with a FINE. Your state pays it out of the petty cash tin.',
          points: `GUILTY. ${v.points}-point deduction.`,
          relegation: 'GUILTY on an industrial scale. Expelled down a division.' }[v.sanction];
    parts.push(h('div', { class: 'card alert' },
      h('h3', {}, '⚖️ The verdict is in'),
      h('p', {}, `${v.charges} charges brought.${v.timeBarred ? ` ${v.timeBarred} were time-barred because they were too old to pursue.` : ''} ${v.remaining} considered.`),
      h('p', { class: 'strong' }, outcome),
      v.guilty ? h('p', { class: 'muted small' }, 'Your inflated deals have been restated to fair market value.') : null));
  }
  for (const v of (r.hmrcVerdicts || [])) {
    parts.push(h('div', { class: `card ${r.liquidation ? 'charged' : 'alert'}` },
      h('h3', {}, '\u{1F3DB}️ The taxman’s verdict'),
      h('p', { class: 'strong' }, v.won
        ? 'You escaped on a technicality. No bill this time. Extraordinary luck.'
        : r.liquidation ? `LIQUIDATION. The ${formatMoney(v.bill)} bill could not be paid.`
          : `You owe ${formatMoney(v.bill)} in back-tax, penalties and interest. Paid, grudgingly.`)));
  }

  // A live cyber incident blocks everything until the player responds.
  if (r.breach && !r.breach.resolved) {
    parts.push(incidentCard(r));
    render(statusBar(r.season), ...parts);
    return;
  }
  if (r.breach && r.breach.resolved) parts.push(incidentOutcomeCard(r));

  // A taxman's case also blocks until answered.
  if (r.newHmrc && !r.newHmrc.resolved) {
    parts.push(hmrcCard(r));
    render(statusBar(r.season), ...parts);
    return;
  }

  const next = h('button', { class: 'primary big' });
  if (r.newCase) {
    parts.push(screenCharged(r));
  } else if (game.over) {
    next.textContent = 'See your legacy →';
    next.addEventListener('click', screenEnd);
    parts.push(next);
  } else {
    next.textContent = 'Cover your tracks →';
    next.addEventListener('click', screenObstruction);
    parts.push(next);
  }
  render(statusBar(r.season), ...parts);
}

function screenObstruction() {
  const div = divisionByTier(game.tier);
  const selected = new Set();
  const openCase = game.cases.find((c) => !c.resolved);
  const preview = h('div', { class: 'preview card' });
  const update = () => {
    const p = previewObstruction(game, [...selected]);
    preview.replaceChildren(
      h('h3', {}, 'Effect on the investigation'),
      meter('Cover level', p.projectedCover, 100, 'cover'),
      h('dl', { class: 'ledger' },
        h('dt', {}, 'Cost this season'), h('dd', {}, formatMoney(p.cost)),
        h('dt', {}, 'Fewer charges stick'), h('dd', {}, `−${pct(p.chargeReduction)}`),
        h('dt', {}, 'Extra delay to any verdict'), h('dd', {}, `+${p.extraDelay} season${p.extraDelay === 1 ? '' : 's'}`),
        h('dt', {}, 'Added suspicion / season'), h('dd', { class: p.standingSuspicion > 4 ? 'warn' : '' }, `+${p.standingSuspicion}`),
        h('dt', {}, 'Non-cooperation story risk'), h('dd', { class: p.nonCoopRisk > 0.2 ? 'warn' : '' }, pct(p.nonCoopRisk))),
      h('p', { class: 'muted small' }, 'Stonewalling buys time, and time is how allegations become "time-barred". But it is itself suspicious, and non-cooperation is a charge in its own right. Select none to cooperate fully.'));
  };
  const card = (o) => {
    const cb = h('input', { type: 'checkbox', id: `o-${o.id}`,
      onchange: (e) => { e.target.checked ? selected.add(o.id) : selected.delete(o.id); update(); } });
    return h('label', { class: `method card obstruct ${o.risky ? 'risky' : ''}`, for: `o-${o.id}` },
      h('div', { class: 'obstruct-head' }, cb,
        h('span', { class: 'emoji', 'aria-hidden': 'true' }, o.emoji),
        h('span', { class: 'm-name' }, o.name),
        h('span', { class: 'muted small' }, `${formatMoney(o.costX * div.scale)}`)),
      h('p', { class: 'muted small' }, o.blurb),
      h('p', { class: 'small' }, `\u{1F4A1} ${o.real}`));
  };
  update();
  render(
    statusBar(),
    h('h2', {}, 'Cover your tracks'),
    h('p', { class: 'muted' }, openCase
      ? `You are under investigation (${openCase.charges} charges, verdict due season ${openCase.verdictSeason}). Throw sand in the gears, or keep your head down?`
      : 'No investigation yet. You can still make yourself a harder target for when one comes.'),
    h('div', { class: 'season-layout' },
      h('div', { class: 'methods' }, OBSTRUCTIONS.map(card)),
      h('aside', {}, preview,
        h('button', { class: 'primary big full', onclick: () => {
          game = applyObstruction(game, [...selected]);
          screenSeason();
        } }, `→ Begin season ${game.season}`))));
}

function incidentCard(r) {
  const vector = vectorById(r.breach.vectorId);
  const div = divisionByTier(game.tier);
  return h('div', { class: 'card incident' },
    h('p', { class: 'kicker' }, '\u{1F6A8} SECURITY INCIDENT — THE CLOCK IS TICKING'),
    h('h3', {}, `${vector.emoji} ${vector.name}`),
    h('p', {}, vector.flavour),
    h('p', { class: 'muted small' }, `\u{1F4A1} ${vector.lesson}`),
    h('p', { class: 'strong' }, `Your security posture is ${Math.round(game.security)}/100. The more of your operation is fake (currently ${pct(r.exposure)}), the more a leak will hurt. How do you respond?`),
    h('div', { class: 'grid' }, RESPONSES.map((resp) => h('button', {
      class: `card choice ${resp.risky ? 'risky' : ''}`,
      onclick: () => {
        const res = resolveBreach(game, resp.id);
        game = res.game;
        screenReport(lastReport(game));
      },
    },
    h('strong', {}, `${resp.emoji} ${resp.name}`),
    h('span', {}, resp.blurb),
    h('span', { class: 'stats' },
      h('span', {}, `Cost: ${formatMoney(resp.costX * div.scale)}`),
      h('span', {}, `Best for: ${resp.best}`))))));
}

function incidentOutcomeCard(r) {
  const vector = vectorById(r.breach.vectorId);
  const resp = responseById(r.breach.response);
  const leakPct = Math.round(r.breach.leaked * 100);
  let verdict;
  if (r.breach.backfired) verdict = 'They took the payment and leaked it anyway. Covering up a breach just added a scandal on top of a scandal.';
  else if (r.breach.leaked < 0.15) verdict = 'Contained fast. Barely anything got out. This is what good security and a quick response buy you.';
  else if (r.breach.leaked < 0.5) verdict = 'A partial leak. Some documents are circulating, but you limited the damage.';
  else verdict = 'A major leak. Your internal documents are now in a journalist’s inbox. This is how the real Football Leaks stories began.';
  return h('div', { class: 'card alert' },
    h('h3', {}, `${vector.emoji} Incident resolved: ${resp.name}`),
    h('p', {}, `${leakPct}% of the at-risk data got out. ${verdict}`),
    r.breach.added > 0
      ? h('p', { class: 'warn' }, `Regulator suspicion +${r.breach.added}.`)
      : h('p', { class: 'strong' }, 'No measurable rise in suspicion. Crisis averted.'));
}

function hmrcCard(r) {
  const nh = r.newHmrc;
  const settleBill = nh.bill * 0.6;
  return h('div', { class: 'card charged' },
    h('p', { class: 'kicker' }, '\u{1F3DB}️ THE TAXMAN COMETH'),
    h('h3', {}, `${HMRC.name} has opened an inquiry into your Employee Benefit Trust.`),
    h('p', {}, `They assess ${formatMoney(nh.exposure)} of unpaid tax. With penalties and interest the full bill would be about ${formatMoney(nh.bill)}.`),
    nh.liquidate ? h('p', { class: 'warn strong' }, 'Warning: that bill is more than the club could ever pay. Fighting and losing means liquidation.') : null,
    h('div', { class: 'grid' },
      h('button', { class: 'card choice', onclick: () => { game = resolveHmrc(game, 'settle'); game.over ? screenEnd() : screenReport(lastReport(game)); } },
        h('strong', {}, '\u{1F91D} Settle quietly now'),
        h('span', {}, `Pay a reduced ${formatMoney(settleBill)} immediately and wipe the slate. Certain, survivable, and it never reaches court.`),
        h('span', { class: 'stats' }, h('span', {}, `Cost: ${formatMoney(settleBill)}`), h('span', {}, 'Risk: none'))),
      h('button', { class: 'card choice risky', onclick: () => { game = resolveHmrc(game, 'fight'); game.over ? screenEnd() : screenReport(lastReport(game)); } },
        h('strong', {}, '⚖️ Fight it, all the way to the Supreme Court'),
        h('span', {}, 'Delay the reckoning by years. A slim chance of escaping on a technicality — but the scheme has been ruled unlawful before, and losing means the full bill.'),
        h('span', { class: 'stats' }, h('span', {}, `If you lose: ${formatMoney(nh.bill)}`), h('span', {}, nh.liquidate ? 'Risk: LIQUIDATION' : 'Risk: a big bill later')))));
}

function screenCharged(r) {
  const div = divisionByTier(game.tier);
  return h('div', { class: 'card charged' },
    h('p', { class: 'kicker' }, 'YOU’VE BEEN RATTLED'),
    h('h3', {}, `The ${r.newCase.regulator} has charged ${game.club.name} with ${r.newCase.charges} alleged breaches.`),
    h('p', {}, `${game.club.name} issues a statement: the club is "surprised and disappointed" and has "a comprehensive body of irrefutable evidence". Hire your legal team:`),
    h('div', { class: 'grid' }, LAWYERS.map((l) => h('button', {
      class: 'card choice', onclick: () => {
        game = hireLawyers(game, l.id);
        if (game.over) screenEnd(); else screenObstruction();
      },
    },
    h('strong', {}, l.name),
    h('span', {}, l.blurb),
    h('span', { class: 'stats' },
      h('span', {}, `Fees: ${formatMoney(l.costX * div.scale)}`),
      h('span', {}, `Delay: ${l.delay} season${l.delay > 1 ? 's' : ''}`))))));
}

function screenEnd() {
  const end = endingTitle(game);
  const score = finalScore(game);
  const div = divisionByTier(game.tier);
  const last = lastReport(game);
  const startRevenue = game.history[0]?.genuine ?? 0;
  const shareText = `I played Sportswash & Go as ${game.title} ${game.owner}. ${game.club.name} went from ${formatMoney(startRevenue)} to ${formatMoney(last.revenue)} revenue (${ordinal(last.moneyRank)} in the world). Rating: "${end.title}" (${score} pts).`;
  const copied = h('span', { class: 'muted small', role: 'status' });
  render(h('section', { class: 'card announce' },
    h('p', { class: 'kicker' }, 'FINAL WHISTLE'),
    h('h2', {}, end.title),
    h('p', { class: 'lede' }, end.blurb),
    moneyTable(moneyLeague(last.revenue, last.season), 9),
    h('dl', { class: 'summary' },
      h('dt', {}, 'Club'), h('dd', {}, game.club.name),
      h('dt', {}, 'Finished in'), h('dd', {}, div.name),
      h('dt', {}, 'Revenue, season 1 → now'), h('dd', {}, `${formatMoney(startRevenue)} → ${formatMoney(last.revenue)}`),
      h('dt', {}, 'Of which genuine'), h('dd', {}, `${formatMoney(last.genuine)} (${pct(last.genuine / last.revenue)})`),
      h('dt', {}, 'Sovereign fund used'), h('dd', {}, `${formatMoney(game.fundSpent)} (${pctFine(fundShare(game))})`),
      h('dt', {}, 'Legal fees'), h('dd', {}, formatMoney(game.legalFees)),
      h('dt', {}, 'Cyber incidents survived'), h('dd', {}, `${game.breachesSurvived}${game.dataLeaked ? ' (but suffered a major leak)' : ''}`),
      h('dt', {}, 'Obstruction'), h('dd', {}, game.obstructionUsed ? `Deployed (cover level ${Math.round(game.coverLevel)}/100)` : 'None — a model of transparency'),
      h('dt', {}, 'Tax bills paid'), h('dd', {}, game.taxBillsPaid > 0 ? formatMoney(game.taxBillsPaid) : (game.taxExposure > 0 ? `None yet (${formatMoney(game.taxExposure)} still owed)` : 'None')),
      game.liquidated ? h('dt', {}, 'Liquidated') : null, game.liquidated ? h('dd', {}, 'Yes — the club died and was reborn in a lower division') : null,
      game.refUsed ? h('dt', {}, 'Referee "hospitality"') : null, game.refUsed ? h('dd', {}, game.matchFixingScandal ? 'Caught: match-fixing proven' : 'Never proven (influence left: ' + Math.round(game.refInfluence) + '/100)') : null,
      h('dt', {}, 'Trophies'), h('dd', {}, String(game.trophies)),
      h('dt', {}, 'Promotions / relegations'), h('dd', {}, `${game.promotions} / ${game.relegations}`),
      h('dt', {}, 'Penalties'), h('dd', {}, game.penalties.length ? h('ul', { class: 'penalties' }, game.penalties.map((x) => h('li', {}, x))) : 'None. Remarkable.'),
      h('dt', {}, 'Score'), h('dd', {}, String(score))),
    h('div', { class: 'hero-actions' },
      h('button', { class: 'primary', onclick: async () => {
        try { await navigator.clipboard.writeText(shareText); copied.textContent = 'Copied!'; }
        catch { copied.textContent = shareText; }
      } }, 'Copy brag text'),
      h('button', { class: 'ghost', onclick: () => { game = null; screenIntro(); } }, 'Buy another club'),
      copied)));
}

// --- playbook --------------------------------------------------------------
function buildPlaybook() {
  const body = document.getElementById('playbook-body');
  const section = (x) => h('section', {}, h('h4', {}, x.h), h('p', {}, x.p));
  const table = h('div', { class: 'table-wrap' }, h('table', {},
    h('caption', {}, 'Rattle risk: how likely each method is to get you caught, by division'),
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Method'), DIVISIONS.map((d) => h('th', { scope: 'col' }, d.name)))),
    h('tbody', {}, METHODS.map((m) => h('tr', {},
      h('th', { scope: 'row' }, `${m.emoji} ${m.name}`),
      DIVISIONS.map((d) => h('td', {}, riskBadge(rattleRating(m, d)))))))));
  const methods = METHODS.map((m) => h('details', { class: 'card method' },
    h('summary', {}, h('span', { class: 'emoji', 'aria-hidden': 'true' }, m.emoji), h('span', { class: 'm-name' }, m.name)),
    h('dl', {},
      h('dt', {}, 'Theory'), h('dd', {}, m.theory),
      h('dt', {}, 'Red flags'), h('dd', {}, m.redFlags),
      h('dt', {}, 'Precedent'), h('dd', {}, m.precedent))));
  const vectors = BREACH_VECTORS.map((v) => h('details', { class: 'card method' },
    h('summary', {}, h('span', { class: 'emoji', 'aria-hidden': 'true' }, v.emoji), h('span', { class: 'm-name' }, v.name)),
    h('dl', {},
      h('dt', {}, 'What it is'), h('dd', {}, v.flavour),
      h('dt', {}, 'How you defend against it'), h('dd', {}, v.lesson))));
  const responses = h('ul', {}, RESPONSES.map((rsp) => h('li', {}, h('strong', {}, `${rsp.emoji} ${rsp.name}: `), rsp.blurb)));
  body.replaceChildren(
    h('p', { class: 'muted' }, 'A satirical guide, built on how football finance rules really work. Learn the rules, then learn why people try to bend them.'),
    h('h3', {}, 'The rules'), ...RULES_EXPLAINER.map(section),
    h('h3', {}, 'From minnow to Money League in 10 years: the blueprint'), ...BLUEPRINT.map(section),
    table, h('h3', {}, 'The methods'), ...methods,
    h('h3', {}, 'The cyber side mission: don’t get leaked'),
    h('p', {}, 'Your biggest secret isn’t on the pitch, it’s in the accounts. A single breach can dump your real finances online, exactly as the real Football Leaks did. Real security is layered: reduce the chance of an incident, and be ready to respond fast when one happens anyway. Both matter, and the game rewards both.'),
    h('h4', {}, 'How attackers get in (what you defend against)'), ...vectors,
    h('h4', {}, 'How you respond (incident response 101)'),
    h('p', { class: 'muted' }, 'The first rule of incident response: contain before you investigate. Speed limits the damage. Covering a breach up almost always makes it worse.'),
    responses,
    h('h3', {}, 'Covering your tracks: obstruction'),
    h('p', {}, 'If a regulator does come knocking, you don’t have to make it easy. After each season you can deploy delaying tactics. They mean fewer charges stick and verdicts take longer — which is how allegations become "time-barred" and drop away. The catch: stonewalling is itself suspicious, and failure to cooperate is one of the most serious charges a club can face. The real-world cases drag on for years precisely because of fights over disclosure.'),
    ...OBSTRUCTIONS.map((o) => h('details', { class: 'card method' },
      h('summary', {}, h('span', { class: 'emoji', 'aria-hidden': 'true' }, o.emoji), h('span', { class: 'm-name' }, o.name)),
      h('dl', {}, h('dt', {}, 'The move'), h('dd', {}, o.blurb), h('dt', {}, 'What it mirrors'), h('dd', {}, o.real)))),
    h('h3', {}, 'The taxman: a second, deadlier enemy'),
    h('p', {}, 'Football’s regulators can dock points. The tax office can end you. The Employee Benefit Trust scheme pays players through "loans" that are never repaid, dodging income tax and hiding the cost from football entirely. It builds an invisible liability — and HMRC is slow, near-impossible to beat in court, and its bill can be more than the club is worth. When Rangers fought and lost, the old company was liquidated and the club restarted in the fourth tier. Settling early is survivable; fighting to the end is a gamble with the club’s life.'),
    h('details', { class: 'card method ebt' },
      h('summary', {}, h('span', { class: 'emoji', 'aria-hidden': 'true' }, EBT.emoji), h('span', { class: 'm-name' }, EBT.name)),
      h('dl', {}, h('dt', {}, 'Theory'), h('dd', {}, EBT.theory), h('dt', {}, 'What catches it'), h('dd', {}, EBT.redFlags), h('dt', {}, 'Precedent'), h('dd', {}, EBT.precedent))),
    h('h3', {}, 'The amortisation loophole'),
    h('details', { class: 'card method' },
      h('summary', {}, h('span', { class: 'emoji', 'aria-hidden': 'true' }, AMORTISATION.emoji), h('span', { class: 'm-name' }, AMORTISATION.name)),
      h('dl', {}, h('dt', {}, 'Theory'), h('dd', {}, AMORTISATION.theory), h('dt', {}, 'Red flags'), h('dd', {}, AMORTISATION.redFlags), h('dt', {}, 'Precedent'), h('dd', {}, AMORTISATION.precedent))),
    h('h3', {}, 'Nobbling the officials: the last line'),
    h('p', {}, 'Every other trick is about money. This one is about the result itself, and it is the gravest thing in the game. Fly referees out for "unconnected" hospitality, and the close calls start going your way. It nudges you up the table — but match-fixing isn’t a points deduction, it’s titles stripped and expulsion, with no lawyer who can save you. It also quietly raises your suspicion every season, because the link you tried to hide is exactly what integrity units look for.'),
    h('details', { class: 'card method ref' },
      h('summary', {}, h('span', { class: 'emoji', 'aria-hidden': 'true' }, REFEREES.emoji), h('span', { class: 'm-name' }, REFEREES.name)),
      h('dl', {}, h('dt', {}, 'Theory'), h('dd', {}, REFEREES.theory), h('dt', {}, 'What catches it'), h('dd', {}, REFEREES.redFlags), h('dt', {}, 'Precedent'), h('dd', {}, REFEREES.precedent))));
}

function openPlaybook() {
  const dlg = document.getElementById('playbook');
  if (!dlg.open) dlg.showModal();
}

document.getElementById('playbook-btn').addEventListener('click', openPlaybook);
document.getElementById('playbook-close').addEventListener('click', () => document.getElementById('playbook').close());
document.getElementById('playbook').addEventListener('click', (e) => { if (e.target.id === 'playbook') e.target.close(); });
document.getElementById('home-btn').addEventListener('click', () => {
  if (!game || game.over || confirm('Abandon your club? Your state will deny it ever existed.')) { game = null; screenIntro(); }
});

buildPlaybook();
screenIntro();
