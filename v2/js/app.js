// v2 UI layer. Security rule: never use innerHTML. All text goes through textContent via h().
import { SEASONS, WEEKS, MAX_CHARGES, TAUNTS, INFLATION, NEWSPAPER, FUNNELS } from './data.js';
import {
  newRun, tick, collect, shred, topUp, choose, nextSeason, mulberry32, dailySeed, formatMoney,
  division, bookedRevenue, strength, moneyLeague, moneyRank, leagueTable, leaguePosition,
  ffpHeadroom, topUpAmount, methodById, stars, bestRank, endingTitle, shareText, fightOdds,
  enterMeeting, meetingSay, leaveMeeting, contactById,
  openTransfer, signTransfer, passTransfer, funnelHeat, legendById, comboMult,
} from './engine.js';
import * as sound from './audio.js';

const app = document.getElementById('app');
const STEP = 0.05; // engine sub-step, seconds

let run = null;
let rng = Math.random;
let daily = false;
let clubName = '';
let speed = 1;
let paused = false;
let rafId = 0;
let lastT = 0;
let ui = null; // live references into the game screen
let leaksHeard = 0;
let raidsHeard = 0;
let matchesSeen = 0;

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
  window.scrollTo({ top: 0 });
}

const clean = (s, max) => String(s || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
const starString = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

// Storage is a convenience only: it can be blocked, so every access is guarded.
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

// A meter whose fill and number update in place each frame.
function liveMeter(label, tone) {
  const fill = h('span', { class: `meter-fill ${tone}` });
  const num = h('strong', {}, '0');
  const track = h('div', { class: 'meter-track', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': label }, fill);
  const el = h('div', { class: 'meter' }, h('div', { class: 'meter-label' }, h('span', {}, label), num), track);
  let last = -1;
  return {
    el,
    set(v) {
      const r = Math.round(v);
      if (r === last) return;
      last = r;
      fill.style.width = `${Math.max(0, Math.min(100, v))}%`;
      num.textContent = String(r);
      track.setAttribute('aria-valuenow', String(r));
    },
  };
}

// --- intro -----------------------------------------------------------------
function screenIntro() {
  stopLoop();
  const best = load('sg2-best', 0);
  const seed = dailySeed();
  const todays = load(`sg2-daily-${seed}`, null);
  const input = h('input', { id: 'club', maxlength: '30', placeholder: 'Sportswash FC', value: clubName, autocomplete: 'off' });
  const go = (isDaily) => {
    clubName = clean(input.value, 30) || 'Sportswash FC';
    startRun(isDaily);
  };
  render(
    h('section', { class: 'hero' },
      h('p', { class: 'kicker' }, 'Real-time edition'),
      h('h1', {}, 'Sportswash ', h('em', {}, '&'), ' Go 2'),
      h('p', { class: 'lede' }, `You own a Championship club and a bottomless sovereign fund. You have ${SEASONS} seasons to make it the richest club on Earth, before the regulator finishes its case file.`),
      h('ul', { class: 'howto' },
        h('li', {}, h('span', { class: 'howto-icon' }, '\u{1F4B0}'), h('span', {}, h('strong', {}, 'Tap deals'), ' to bank them. Gold ones are worth more, and are far hotter.')),
        h('li', {}, h('span', { class: 'howto-icon' }, '\u{1F4C4}'), h('span', {}, h('strong', {}, 'Shred leaks'), ' before they reach the journalist, or they go in the Case File.')),
        h('li', {}, h('span', { class: 'howto-icon' }, '\u{1F525}'), h('span', {}, h('strong', {}, 'Watch the Heat.'), ' Hot money fills the Case File fast. The regulator learns your favourite tricks.')),
        h('li', {}, h('span', { class: 'howto-icon' }, '\u{1F0CF}'), h('span', {}, h('strong', {}, 'Swipe the cards'), ' left or right when someone wants a decision.'))),
      h('div', { class: 'form' },
        h('label', { for: 'club' }, 'Name your club'),
        input),
      h('div', { class: 'hero-actions' },
        h('button', { type: 'button', class: 'primary big', onclick: () => go(false) }, 'Kick off'),
        h('button', { type: 'button', class: 'ghost big', onclick: () => go(true) },
          `\u{1F4C5} Daily Fixture #${seed}`, todays ? ` (${starString(todays.stars)})` : '')),
      best ? h('p', { class: 'muted' }, `Your best: ${starString(best)}`) : null,
      h('p', { class: 'muted small' }, 'Keys: Space pauses, 1/2/3 sets speed, ←/→ answers cards.')),
  );
}

// --- the run -----------------------------------------------------------------
function startRun(isDaily) {
  daily = isDaily;
  const seed = isDaily ? dailySeed() : Math.floor(Math.random() * 2 ** 31);
  rng = mulberry32(seed);
  run = newRun({ clubName, seed }, rng);
  leaksHeard = 0;
  raidsHeard = 0;
  matchesSeen = 0;
  sound.unlock();
  speed = 1;
  paused = false;
  screenGame();
}

function screenGame() {
  const heat = liveMeter('\u{1F525} Heat', 'bad');
  const caseFile = liveMeter('\u{1F4C1} Case File', 'case');
  const fans = liveMeter('❤️ Fans', 'good');
  const t = (cls = '') => h('span', { class: cls }, '');
  ui = {
    heat, caseFile, fans,
    season: t(), week: t(), division: t(), position: t(), points: t(),
    revenue: t('strong'), rank: t('strong'), strength: t('strong'), charges: t('strong'), combo: t('strong'),
    raidBanner: h('div', { class: 'raid-banner', role: 'alert', hidden: true }),
    ticker: h('div', { class: 'ticker', 'aria-live': 'polite', hidden: true }),
    timers: [],
    lastRaidSeen: 0,
    topUpBtn: h('button', { type: 'button', class: 'ghost small-btn', onclick: onTopUp }),
    pauseBtn: h('button', { type: 'button', class: 'ghost small-btn', onclick: togglePause }),
    speedBtns: [1, 2, 3].map((n) => h('button', { type: 'button', class: 'ghost small-btn', 'aria-pressed': 'false', onclick: () => setSpeed(n) }, `${n}×`)),
    arena: h('div', { class: 'arena', role: 'group', 'aria-label': 'The pitch: deals and leaks appear here' },
      h('div', { class: 'journalist', 'aria-hidden': 'true' }, '\u{1F575}️', h('span', {}, 'Press'))),
    news: h('ol', { class: 'news', 'aria-live': 'polite' }),
    signed: h('ul', { class: 'signed' }),
    signedKey: '',
    table: h('tbody'),
    els: new Map(),
    newsKey: '',
    tableTick: 0,
    overlay: null,
  };
  render(
    h('div', { class: 'hud card' },
      h('div', { class: 'hud-top' },
        h('div', { class: 'hud-club' },
          h('strong', { class: 'club-name' }, run.club),
          h('span', { class: 'muted small' }, ui.season, ' · ', ui.week, ' · ', ui.division)),
        h('div', { class: 'hud-stats' },
          h('span', {}, 'Pos ', ui.position, ' ', ui.points),
          h('span', {}, 'Revenue ', ui.revenue),
          h('span', {}, 'Money League ', ui.rank),
          h('span', {}, 'Squad ', ui.strength),
          h('span', { title: 'Fair-value deals in a row multiply their value. Any inflated deal, off-book money or landed leak breaks it.' }, 'Streak ', ui.combo),
          h('span', {}, '⚖️ ', ui.charges))),
      h('div', { class: 'hud-meters' }, heat.el, caseFile.el, fans.el)),
    h('div', { class: 'play-layout' },
      h('div', {},
        ui.arena,
        h('div', { class: 'controls' },
          ui.pauseBtn, ...ui.speedBtns,
          h('span', { class: 'spacer' }),
          ui.topUpBtn)),
      h('aside', {},
        h('div', { class: 'card' }, h('h3', { class: 'side-h' }, 'Headlines'), ui.news),
        h('div', { class: 'card' }, h('h3', { class: 'side-h' }, '\u{1F31F} Your legends'), ui.signed),
        h('div', { class: 'card' },
          h('table', { class: 'mini' }, h('caption', {}, 'League table'), ui.table)))),
  );
  ui.arena.append(ui.raidBanner, ui.ticker);
  setSpeed(speed);
  sync();
  sound.duck(false);
  sound.startMusic();
  sound.whistle();
  startLoop();
}

function startLoop() {
  stopLoop();
  lastT = performance.now();
  rafId = requestAnimationFrame(frame);
}
// A big match plays out over a few seconds as a score ticker over the pitch.
function playTicker(m) {
  const box = ui.ticker;
  const at = (ms, fn) => ui.timers.push(setTimeout(fn, ms));
  let you = 0;
  let them = 0;
  const score = () => `${run.club} ${you}-${them} ${m.opp}`;
  box.hidden = false;
  box.classList.remove('done');
  box.replaceChildren(h('strong', {}, `\u26BD ${m.title}`), h('span', {}, `${score()} \u00B7 Kick-off`));
  sound.whistle();
  const span = 4200;
  for (const e of m.events) {
    at(400 + (e.min / 90) * span, () => {
      if (e.side === 'you') { you++; sound.cheer(); } else { them++; sound.leak(); }
      box.replaceChildren(h('strong', {}, `\u26BD ${m.title}`), h('span', {}, `${score()} \u00B7 ${e.scorer} ${e.min}'`));
    });
  }
  at(span + 700, () => {
    box.classList.add('done');
    box.replaceChildren(h('strong', {}, 'Full time'), h('span', {}, `${run.club} ${m.you}-${m.them} ${m.opp}`));
    sound.whistle(true);
  });
  at(span + 3200, () => { box.hidden = true; });
}

function stopLoop() {
  if (ui?.timers) { ui.timers.forEach(clearTimeout); ui.timers = []; }
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  sound.stopMusic();
}

function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000) * speed;
  lastT = now;
  if (!paused && run.phase === 'play' && !ui.overlay) {
    for (let left = dt; left > 1e-6; left -= STEP) tick(run, Math.min(STEP, left), rng);
  }
  sync();
  sound.setHeat(run.heat);
  sound.duck(paused || run.phase !== 'play');
  if (run.leaksLanded > leaksHeard) { leaksHeard = run.leaksLanded; sound.leak(); }
  if (run.raids > raidsHeard) { raidsHeard = run.raids; sound.siren(3); }
  if (run.lastRaid && run.lastRaid.id > ui.lastRaidSeen) {
    ui.lastRaidSeen = run.lastRaid.id;
    if (run.lastRaid.clean) { sound.fanfare(); floatText(0.5, 0.5, 'Raid over: they found nothing!', 'streak'); }
    else floatText(0.5, 0.5, `Raid over: ${run.lastRaid.missed} documents seized`, 'hot');
  }
  if (run.bigMatches > matchesSeen) { matchesSeen = run.bigMatches; playTicker(run.lastBigMatch); }
  if (run.phase === 'card') { showCard(); }
  if (run.phase === 'meeting') { showMeeting(); }
  if (run.phase === 'transfer') { showTransfer(); }
  if (run.phase === 'seasonEnd') { stopLoop(); screenSeasonEnd(); return; }
  if (run.phase === 'over') { stopLoop(); screenEnd(); return; }
  rafId = requestAnimationFrame(frame);
}

function sync() {
  const div = division(run);
  ui.heat.set(run.heat);
  ui.caseFile.set(run.caseFile);
  ui.fans.set(run.fans);
  ui.season.textContent = `Season ${run.seasonNo}/${SEASONS}`;
  ui.week.textContent = `Week ${Math.min(run.week + 1, WEEKS)}/${WEEKS}`;
  ui.division.textContent = div.name;
  ui.position.textContent = ordinal(leaguePosition(run));
  ui.points.textContent = `(${run.pts} pts)`;
  const rev = bookedRevenue(run);
  ui.revenue.textContent = formatMoney(rev);
  ui.rank.textContent = `#${moneyRank(run, rev)}`;
  ui.strength.textContent = String(Math.round(strength(run)));
  ui.charges.textContent = `${run.charges}/${MAX_CHARGES}`;
  ui.combo.textContent = run.combo > 1 ? `\u00D7${comboMult(run.combo).toFixed(2)}` : '\u2014';
  ui.combo.classList.toggle('streak-on', run.combo > 1);
  ui.arena.classList.toggle('raid', !!run.raid);
  ui.raidBanner.hidden = !run.raid;
  if (run.raid) ui.raidBanner.textContent = `\u{1F6A8} DAWN RAID! Shred everything! ${Math.max(0, Math.ceil(run.raid.left))}s`;
  const head = ffpHeadroom(run);
  ui.topUpBtn.textContent = `\u{1F4B7} Honest top-up +${formatMoney(topUpAmount(run))}`;
  ui.topUpBtn.title = `Owner equity: no heat, but over the ${formatMoney(div.lossLimit)} loss limit it's an FFP breach. Headroom: ${formatMoney(head)}`;
  ui.topUpBtn.classList.toggle('over', head < topUpAmount(run));
  ui.pauseBtn.textContent = paused ? '▶ Play' : '⏸ Pause';
  syncBubbles();
  syncNews();
  syncSigned();
  if (--ui.tableTick <= 0) { syncTable(); ui.tableTick = 15; }
}

function syncBubbles() {
  const live = new Set();
  for (const b of run.bubbles) {
    live.add(b.id);
    let el = ui.els.get(b.id);
    if (!el) {
      el = b.type === 'deal' ? dealEl(b) : b.type === 'door' ? doorEl(b) : b.type === 'transfer' ? starEl(b) : leakEl(b);
      ui.els.set(b.id, el);
      ui.arena.append(el);
    }
    el.style.left = `${b.x * 100}%`;
    el.style.top = `${b.y * 100}%`;
    if (b.type !== 'leak') el.style.setProperty('--life', String(Math.max(0, b.life / b.maxLife)));
  }
  for (const [id, el] of ui.els) {
    if (!live.has(id)) { el.remove(); ui.els.delete(id); }
  }
}

function dealEl(b) {
  const m = methodById(b.methodId);
  const infl = INFLATION.find((x) => x.mult === b.infl);
  return h('button', {
    type: 'button', class: `bubble deal infl-${b.infl}`,
    'aria-label': `${m.name}, ${formatMoney(b.value)}, ${infl.label}`,
    title: `${m.name} (${infl.label})`,
    onclick: () => onCollect(b.id),
  }, h('span', { class: 'b-emoji', 'aria-hidden': 'true' }, m.emoji), h('span', { class: 'b-value' }, formatMoney(b.value)));
}

function starEl(b) {
  const l = legendById(b.legendId);
  return h('button', {
    type: 'button', class: 'bubble star', 'aria-label': `Transfer target: ${l.name}, ${l.pos}`,
    title: `${l.name} is available...`,
    onclick: () => onStar(b.id),
  }, h('span', { class: 'b-emoji', 'aria-hidden': 'true' }, '\u{1F31F}'), h('span', { class: 'b-value' }, l.name.split(' ').pop()));
}

function onStar(id) {
  if (openTransfer(run, id, rng)) { sound.cardIn(); sync(); }
}

function doorEl(b) {
  return h('button', {
    type: 'button', class: 'bubble door', 'aria-label': 'A private meeting: enter the back room',
    title: 'A private meeting...',
    onclick: () => onDoor(b.id),
  }, h('span', { class: 'b-emoji', 'aria-hidden': 'true' }, '\u{1F6AA}'), h('span', { class: 'b-value' }, 'Back room'));
}

function onDoor(id) {
  if (enterMeeting(run, id, rng)) { sound.door(); sync(); }
}

function leakEl(b) {
  return h('button', {
    type: 'button', class: 'bubble leak', 'aria-label': 'Leaked document: shred it',
    onpointerdown: (e) => { e.preventDefault(); onShred(b.id); },
    onclick: () => onShred(b.id),
  }, '\u{1F4C4}');
}

function floatText(x, y, text, cls) {
  const el = h('span', { class: `float ${cls}`, 'aria-hidden': 'true' }, text);
  el.style.left = `${x * 100}%`;
  el.style.top = `${y * 100}%`;
  el.addEventListener('animationend', () => el.remove());
  ui.arena.append(el);
}

function onCollect(id) {
  const b = run.bubbles.find((x) => x.id === id);
  const res = collect(run, id, rng);
  if (res && b) {
    const streak = res.mult > 1 ? `  \u00D7${res.mult.toFixed(2)}` : '';
    floatText(b.x, b.y, `+${formatMoney(res.value)}${streak}  \u{1F525}+${Math.round(res.heat)}`, res.heat > 15 ? 'hot' : res.mult > 1 ? 'streak' : 'cash');
    if (res.combo > 1) sound.streak(res.combo);
    if (b.infl >= 4) sound.bigCash(); else sound.coin();
  }
  sync();
}

function onShred(id) {
  const b = run.bubbles.find((x) => x.id === id);
  if (b && shred(run, id)) { floatText(b.x, b.y, 'Shredded', 'shred'); sound.shred(); }
  sync();
}

function onTopUp() {
  const amt = topUp(run);
  if (amt) { floatText(0.5, 0.92, `+${formatMoney(amt)} owner equity`, 'cash'); sound.coin(); }
  sync();
}

function syncNews() {
  const key = run.news.map((n) => n.text + n.week).join('|');
  if (key === ui.newsKey) return;
  ui.newsKey = key;
  ui.news.replaceChildren(...run.news.slice(0, 5).map((n) =>
    h('li', { class: n.tone }, h('span', { class: 'muted small' }, `S${n.season} W${n.week}`), ' ', n.text)));
}

function syncSigned() {
  const key = run.signed.join(',');
  if (key === ui.signedKey) return;
  ui.signedKey = key;
  ui.signed.replaceChildren(...(run.signed.length
    ? run.signed.map((id) => { const l = legendById(id); return h('li', {}, h('strong', {}, l.name), ` \u00B7 ${l.pos}`); })
    : [h('li', { class: 'muted' }, 'Tap a \u{1F31F} to sign one.')]));
}

function syncTable() {
  const rows = leagueTable(run);
  const youIdx = rows.findIndex((r) => r.you);
  const show = rows.filter((r, i) => i < 4 || Math.abs(i - youIdx) <= 1 || i === rows.length - 1);
  const div = division(run);
  ui.table.replaceChildren(...show.map((r) => {
    const i = rows.indexOf(r);
    const zone = div.up && i < div.up ? 'up' : div.down && i >= rows.length - div.down ? 'down' : '';
    return h('tr', { class: `${r.you ? 'you' : ''} ${zone}` },
      h('td', {}, String(i + 1)), h('th', { scope: 'row' }, r.name), h('td', { class: 'num' }, String(r.pts)));
  }));
}

function togglePause() {
  if (run.phase !== 'play') return;
  paused = !paused;
  sync();
}

function setSpeed(n) {
  speed = n;
  ui.speedBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === n)));
}

// --- cards --------------------------------------------------------------------
const FX_ICONS = { deal: '\u{1F91D}', heat: '\u{1F525}', case: '\u{1F4C1}', fans: '❤️', spend: '⚽', oneoff: '\u{1F4B0}', points: '\u{1F3C6}' };

// Reigns-style: show which meters an answer touches, never by how much.
function fxHints(opt) {
  if (!opt.fx) return null;
  const keys = Object.keys(opt.fx).filter((k) => FX_ICONS[k]);
  const icons = keys.map((k) => FX_ICONS[k]);
  if (opt.risk) icons.push('\u{1F3B2}');
  return icons.length ? h('span', { class: 'fx', 'aria-label': `Affects: ${keys.join(', ')}${opt.risk ? ', and a gamble' : ''}` }, icons.join(' ')) : null;
}

function showCard() {
  if (ui.overlay) return;
  const c = run.card;
  const label = (side) => {
    const o = c[side];
    if (c.hearing && side === 'right') return `${o.label} (${Math.round(fightOdds(run) * 100)}% chance)`;
    if (c.expose && side === 'left') return `${o.label} (${Math.round(o.odds * 100)}% chance)`;
    return o.label;
  };
  const answer = (side) => {
    if (!ui.overlay) return;
    const outcome = choose(run, side, rng);
    sound.click();
    if (outcome) setTimeout(c.hearing ? sound.gavel : sound.leak, 120);
    ui.overlay.remove();
    ui.overlay = null;
    if (outcome) floatText(0.5, 0.5, outcome, 'hot');
    lastT = performance.now();
    sync();
  };
  const card = h('div', { class: `swipe-card${c.hearing ? ' hearing' : ''}${c.expose ? ' expose' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'card-text' },
    h('div', { class: 'who', 'aria-hidden': 'true' }, c.who),
    h('p', { class: 'kicker' }, c.speaker),
    h('p', { class: 'card-text', id: 'card-text' }, c.text),
    h('div', { class: 'card-options' },
      h('button', { type: 'button', class: 'opt left', onclick: () => answer('left') }, h('span', {}, '← ', label('left')), fxHints(c.left)),
      h('button', { type: 'button', class: 'opt right', onclick: () => answer('right') }, h('span', {}, label('right'), ' →'), fxHints(c.right))),
    h('p', { class: 'muted small swipe-hint' }, 'Swipe, tap, or use the arrow keys'));
  attachSwipe(card, answer);
  ui.overlay = h('div', { class: 'overlay' }, card);
  ui.overlay.answer = answer;
  document.body.append(ui.overlay);
  if (c.hearing) sound.gavel(); else if (c.expose) sound.sting(); else sound.cardIn();
  card.querySelector('.opt.left').focus({ preventScroll: true });
}

// --- the transfer market -----------------------------------------------------------
function showTransfer() {
  if (ui.overlay) return;
  const t = run.transfer;
  const l = legendById(t.legendId);
  const sign = (fid) => {
    const res = signTransfer(run, fid, rng);
    closeOverlay();
    if (!res) return;
    sound.cheer();
    floatText(0.5, 0.45, `\u{1F31F} ${l.name} signs!${res.heat ? `  \u{1F525}+${Math.round(res.heat)}` : ''}`, res.heat > 15 ? 'hot' : 'cash');
    if (res.talked) setTimeout(sound.leak, 400);
  };
  const headroom = ffpHeadroom(run) - t.gap;
  const card = h('div', { class: 'swipe-card transfer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'transfer-name' },
    h('p', { class: 'kicker' }, '\u{1F31F} Transfer window'),
    h('p', { class: 'legend-name', id: 'transfer-name' }, l.name),
    h('p', { class: 'muted' }, `${l.pos} \u00B7 rated ${l.rating} \u00B7 a legend of days gone by, in his prime`),
    h('dl', { class: 'fees' },
      h('dt', {}, 'Public fee (what the papers see)'), h('dd', {}, formatMoney(t.publicFee)),
      h('dt', {}, 'Real asking price'), h('dd', {}, formatMoney(t.realPrice)),
      h('dt', {}, 'The gap, paid... somehow'), h('dd', { class: 'gap' }, formatMoney(t.gap))),
    h('div', { class: 'funnels' },
      FUNNELS.map((f) => {
        const heat = funnelHeat(run, f.id);
        const note = f.id === 'honest'
          ? (headroom < 0 ? `\u26A0\uFE0F Breaches the loss limit by ${formatMoney(-headroom)}` : `Loss-limit headroom after: ${formatMoney(headroom)}`)
          : `\u{1F525} about +${Math.round(heat)}${f.risk ? ' \u00B7 \u{1F3B2} the agent might talk' : ''}`;
        return h('button', { type: 'button', class: `funnel${f.id === 'honest' && headroom < 0 ? ' over' : ''}`, onclick: () => sign(f.id) },
          h('strong', {}, f.name), h('span', { class: 'small muted' }, f.desc), h('span', { class: 'small' }, note));
      })),
    h('button', { type: 'button', class: 'ghost full', onclick: () => { passTransfer(run); closeOverlay(); sound.click(); } }, 'Walk away'));
  ui.overlay = h('div', { class: 'overlay' }, card);
  document.body.append(ui.overlay);
  card.querySelector('.funnel').focus({ preventScroll: true });
}

// --- the back room --------------------------------------------------------------
const TONE_LABEL = { safe: 'Play it safe', bold: 'Bold', reckless: 'Reckless' };

function showMeeting() {
  if (ui.overlay) return;
  ui.overlay = h('div', { class: 'overlay room-overlay' });
  document.body.append(ui.overlay);
  renderMeeting();
}

function closeOverlay() {
  if (!ui.overlay) return;
  ui.overlay.remove();
  ui.overlay = null;
  lastT = performance.now();
  sync();
}

function renderMeeting() {
  const m = run.meeting;
  const contact = contactById(m.contactId);
  const round = contact.rounds[m.round];
  const say = (i) => {
    const opt = round.options[i];
    const res = meetingSay(run, i, rng);
    if (opt.tone === 'reckless') sound.heartbeat(); else sound.click();
    if (res?.done) meetingOver(res.result); else renderMeeting();
  };
  const room = h('div', { class: 'room', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'room-prompt' },
    h('p', { class: 'kicker' }, '\u{1F6AA} The Back Room \u00B7 ', `Round ${m.round + 1} of ${contact.rounds.length}`),
    h('div', { class: 'room-head' },
      h('span', { class: 'who', 'aria-hidden': 'true' }, contact.who),
      h('div', {}, h('strong', {}, contact.name), h('p', { class: 'muted small' }, contact.intro))),
    h('ul', { class: 'room-notes', 'aria-label': 'What you notice' },
      m.lines.map((line) => h('li', {}, line))),
    h('p', { class: 'room-prompt', id: 'room-prompt' }, `\u201C${round.prompt}\u201D`),
    h('div', { class: 'room-options' },
      round.options.map((o, i) => h('button', { type: 'button', class: `say ${o.tone}`, onclick: () => say(i) },
        h('span', { class: 'tone' }, TONE_LABEL[o.tone]),
        h('span', {}, `\u201C${o.label}\u201D`),
        fxHints(o)))),
    h('div', { class: 'room-foot' },
      h('span', { class: 'tape', title: 'How damning this would be if the room is wired' },
        '\u{1F399}\uFE0F On tape (if wired): ', m.tape ? '\u{1F534}'.repeat(m.tape) : 'nothing yet'),
      h('button', { type: 'button', class: 'ghost', onclick: () => { sound.door(); meetingOver(leaveMeeting(run, rng).result); } }, 'Walk out')),
    h('p', { class: 'muted small' }, 'Undercover newspaper stings are a matter of public record: in 2016 one ended an England manager\u2019s tenure after a single match.'));
  ui.overlay.replaceChildren(room);
  room.querySelector('.say').focus({ preventScroll: true });
}

function meetingOver(result) {
  const text = {
    stung: [`\u{1F4F1} That evening your phone buzzes. ${NEWSPAPER} is \u201Cseeking comment\u201D.`, 'The story lands in a few weeks. Start praying.'],
    dodged: [`\u{1F4F8} The \u201Ccontact\u201D was a ${NEWSPAPER} reporter.`, 'You said nothing usable. Your caution saved you.'],
    clean: ['\u{1F91D} Meeting over. Nobody saw a thing.', 'Probably.'],
  }[result];
  if (result === 'stung') sound.sting(); else if (result === 'dodged') sound.fanfare(); else sound.coin();
  const room = h('div', { class: `room result-${result}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'room-result' },
    h('p', { class: 'kicker' }, '\u{1F6AA} The Back Room'),
    h('p', { class: 'room-prompt', id: 'room-result' }, text[0]),
    h('p', {}, text[1]),
    h('button', { type: 'button', class: 'primary', onclick: closeOverlay }, 'Back to the season'));
  ui.overlay.replaceChildren(room);
  room.querySelector('button').focus({ preventScroll: true });
}

function attachSwipe(card, answer) {
  let startX = null;
  let dx = 0;
  card.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    startX = e.clientX; dx = 0;
    card.setPointerCapture(e.pointerId);
    card.classList.add('dragging');
  });
  card.addEventListener('pointermove', (e) => {
    if (startX == null) return;
    dx = e.clientX - startX;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    card.classList.toggle('lean-left', dx < -40);
    card.classList.toggle('lean-right', dx > 40);
  });
  const end = () => {
    if (startX == null) return;
    startX = null;
    card.classList.remove('dragging', 'lean-left', 'lean-right');
    card.style.transform = '';
    if (Math.abs(dx) > 90) answer(dx < 0 ? 'left' : 'right');
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
}

// --- season end and game end -------------------------------------------------------
function moneyTable(rows) {
  const youIdx = rows.findIndex((r) => r.you);
  const show = rows.filter((r, i) => i < 5 || i === youIdx);
  return h('table', { class: 'money' },
    h('caption', {}, 'Football Money League'),
    h('tbody', {}, show.map((r) => h('tr', { class: r.you ? 'you' : '' },
      h('td', {}, String(rows.indexOf(r) + 1)),
      h('th', { scope: 'row' }, r.name),
      h('td', { class: 'num' }, formatMoney(r.revenue))))));
}

function screenSeasonEnd() {
  const ls = run.lastSeason;
  const last = ls.seasonNo >= SEASONS;
  const move = ls.moved < 0 ? '⬆️ Promoted!' : ls.moved > 0 ? '⬇️ Relegated.' : '';
  if (ls.moved < 0 || ls.pos === 1) sound.fanfare(); else if (ls.moved > 0) sound.sadTrombone(); else sound.whistle(true);
  render(h('section', { class: 'card announce big-result' },
    h('p', { class: 'kicker' }, `Season ${ls.seasonNo} of ${SEASONS} complete`),
    h('p', { class: 'position' }, ordinal(ls.pos), h('span', {}, ` of ${ls.teams} in the ${ls.division}`)),
    move ? h('p', { class: 'strong' }, move) : null,
    ls.ffpBreach ? h('p', { class: 'warn' }, 'Your honest top-ups broke the loss limit: points deducted next season and the Case File grows.') : null,
    h('p', {}, `Booked revenue: `, h('strong', {}, formatMoney(ls.revenue)), `, ${ordinal(ls.rank)} in the world.`),
    moneyTable(moneyLeague(run, ls.revenue)),
    h('p', { class: 'muted small' }, 'Over the summer some of the Case File goes stale and the Heat cools. Recurring deals last three seasons; one-off sales don\'t repeat.'),
    h('button', { type: 'button', class: 'primary big', onclick: () => { nextSeason(run); if (run.phase === 'over') screenEnd(); else screenGame(); } },
      last ? 'See the verdict' : `Start season ${ls.seasonNo + 1}`)));
}

function screenEnd() {
  if (ui?.overlay) { ui.overlay.remove(); ui.overlay = null; }
  const st = stars(run);
  if (st > load('sg2-best', 0)) save('sg2-best', st);
  if (daily) save(`sg2-daily-${run.seed}`, { stars: st });
  const text = shareText(run, daily);
  const status = h('p', { class: 'muted small', 'aria-live': 'polite' });
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); status.textContent = 'Copied. Go and brag.'; } catch { status.textContent = 'Copy failed: select the text above instead.'; }
  };
  const lost = run.over.reason !== 'complete' || st === 0;
  if (lost) sound.sadTrombone(); else sound.fanfare();
  render(h('section', { class: 'card announce big-result' },
    h('p', { class: 'kicker' }, daily ? `Daily Fixture #${run.seed}` : 'Final verdict'),
    h('h2', {}, endingTitle(run)),
    h('p', { class: 'stars', 'aria-label': `${st} of 3 stars` }, starString(st)),
    lost ? h('p', { class: 'taunt' }, '\u{1F474} ', TAUNTS[Math.floor(Math.random() * TAUNTS.length)]) : null,
    h('p', {}, `Best Money League rank: `, h('strong', {}, run.history.length ? `#${bestRank(run)}` : 'n/a'), ` · Proven charges: `, h('strong', {}, `${run.charges}/${MAX_CHARGES}`)),
    run.history.length ? h('table', { class: 'mini history' },
      h('caption', {}, 'Your seasons'),
      h('tbody', {}, run.history.map((s) => h('tr', {},
        h('td', {}, `S${s.seasonNo}`), h('th', { scope: 'row' }, s.division), h('td', {}, ordinal(s.pos)),
        h('td', { class: 'num' }, formatMoney(s.revenue)), h('td', { class: 'num' }, `#${s.rank}`))))) : null,
    h('p', { class: 'muted small' }, '⭐ a top-10 Money League season · ⭐⭐ No. 1 · ⭐⭐⭐ No. 1 with nothing proven'),
    h('pre', { class: 'share' }, text),
    h('div', { class: 'hero-actions' },
      h('button', { type: 'button', class: 'primary big', onclick: () => startRun(false) }, 'One more go'),
      h('button', { type: 'button', class: 'ghost', onclick: copy }, 'Copy result'),
      h('button', { type: 'button', class: 'ghost', onclick: screenIntro }, 'Main menu')),
    status));
}

// --- global wiring ------------------------------------------------------------
document.getElementById('home-btn').addEventListener('click', screenIntro);

const SOUND_MODES = [
  ['all', '\u{1F50A} Sound on'],
  ['sfx', '\u{1F509} Effects only'],
  ['off', '\u{1F507} Muted'],
];
const soundBtn = document.getElementById('sound-btn');
function showSoundMode() {
  const m = SOUND_MODES.find((x) => x[0] === sound.getMode()) || SOUND_MODES[0];
  soundBtn.textContent = m[1];
  soundBtn.setAttribute('aria-label', `Sound: ${m[1]}. Click to change`);
}
soundBtn.addEventListener('click', () => {
  const i = SOUND_MODES.findIndex((x) => x[0] === sound.getMode());
  const next = SOUND_MODES[(i + 1) % SOUND_MODES.length][0];
  sound.unlock();
  sound.setMode(next);
  save('sg2-sound', next);
  showSoundMode();
  sound.click();
});
sound.setMode(load('sg2-sound', 'all'));
showSoundMode();

document.addEventListener('keydown', (e) => {
  if (!run || e.target instanceof HTMLInputElement) return;
  if (ui?.overlay?.answer && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    ui.overlay.answer(e.key === 'ArrowLeft' ? 'left' : 'right');
  } else if (ui?.overlay) {
    // keys belong to the dialog while one is open
  } else if (e.key === ' ' && rafId) {
    e.preventDefault();
    togglePause();
  } else if (['1', '2', '3'].includes(e.key) && rafId) {
    setSpeed(Number(e.key));
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && run?.phase === 'play' && rafId) { paused = true; sync(); }
  sound.suspend(document.hidden);
});

screenIntro();
