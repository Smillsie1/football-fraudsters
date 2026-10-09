// Balance harness for v2: plays bots through many seeded runs and prints outcomes.
//   node tools/sim-v2.js [gamesPerBot]
// Design target: careful play can earn stars; clicking everything usually ends
// in expulsion; doing nothing never tops the Money League.
import { newRun, tick, collect, shred, choose, nextSeason, topUp, ffpHeadroom, topUpAmount, stars, bestRank, mulberry32, methodById, methodHeatMult, division,
  enterMeeting, meetingSay, leaveMeeting } from '../v2/js/engine.js';
import { TELLS } from '../v2/js/data.js';

const DT = 0.1;
const REACT = 0.8;  // seconds before a bot notices a bubble
const SHRED_P = 0.85; // chance a bot catches each leak (humans miss some)

const BOTS = {
  idle: { take: () => false, hearing: 'left' },
  fair: { take: (s, b) => b.infl === 1, hearing: 'left' },
  greedy: { take: () => true, hearing: 'right' },
  careful: { take: (s, b) => s.heat < 45 && b.infl <= 2, hearing: 'left' },
  gambler: { take: (s, b) => s.heat < 70, hearing: 'right' },
  // Reads the heat it's about to take on, tops up honestly to the FFP limit,
  // and picks the card option that adds the least heat + case.
  skilled: {
    take: (s, b) => s.heat + expectedHeat(s, b) < 55,
    hearing: 'left', topUp: true, smartCards: true,
  },
  // Same as skilled, but also takes back-room meetings: bold until a tell
  // shows up, then walks out.
  schemer: {
    take: (s, b) => s.heat + expectedHeat(s, b) < 55,
    hearing: 'left', topUp: true, smartCards: true, meet: 'read',
  },
  // Skilled, but says the most reckless thing in every meeting.
  reckless: {
    take: (s, b) => s.heat + expectedHeat(s, b) < 55,
    hearing: 'left', topUp: true, smartCards: true, meet: 'reckless',
  },
};

function meetingMove(s, bot, rng) {
  const m = s.meeting;
  if (bot.meet === 'reckless') return meetingSay(s, 2, rng);
  if (TELLS.includes(m.lines[m.lines.length - 1])) return leaveMeeting(s, rng);
  return meetingSay(s, 1, rng);
}

function expectedHeat(s, b) {
  const m = methodById(b.methodId);
  return m.heat * b.infl ** 1.4 * methodHeatMult(s, m.id) * division(s).scrutiny;
}
const risk = (o) => (o.fx.heat || 0) + 1.5 * (o.fx.case || 0) - (o.fx.fans || 0) * 0.5 + (o.risk ? o.risk.p * ((o.risk.fx.case || 0) * 1.5) : 0);

function play(bot, seed) {
  const rng = mulberry32(seed);
  const s = newRun({ seed }, rng);
  const missed = new Set();
  let guard = 0;
  while (s.phase !== 'over' && guard++ < 100000) {
    if (s.phase === 'play') {
      tick(s, DT, rng);
      if (bot.topUp) while (s.phase === 'play' && ffpHeadroom(s) >= topUpAmount(s)) topUp(s);
      for (const b of [...s.bubbles]) {
        if (b.type === 'deal' && b.maxLife - b.life > REACT && bot.take(s, b)) collect(s, b.id, rng);
        if (b.type === 'door' && bot.meet && s.phase === 'play') enterMeeting(s, b.id, rng);
        if (b.type === 'leak' && b.x > 0.3 && !missed.has(b.id)) {
          if (rng() < SHRED_P) shred(s, b.id); else missed.add(b.id);
        }
      }
    } else if (s.phase === 'card') {
      const c = s.card;
      const side = c.hearing ? bot.hearing
        : c.expose ? 'right'
        : bot.smartCards ? (risk(c.left) <= risk(c.right) ? 'left' : 'right')
        : rng() < 0.5 ? 'left' : 'right';
      choose(s, side, rng);
    } else if (s.phase === 'meeting') meetingMove(s, bot, rng);
    else if (s.phase === 'seasonEnd') nextSeason(s);
  }
  return s;
}

const N = Number(process.argv[2]) || 300;
for (const [name, bot] of Object.entries(BOTS)) {
  const res = { complete: 0, expelled: 0, revolt: 0 };
  const st = [0, 0, 0, 0];
  let rankSum = 0; let prem = 0; let stung = 0;
  for (let i = 0; i < N; i++) {
    const s = play(bot, 1000 + i);
    res[s.over.reason]++;
    st[stars(s)]++;
    rankSum += bestRank(s);
    stung += s.stings;
    if (s.history.some((h) => h.division === 'Premier League')) prem++;
  }
  const p = (x) => `${Math.round((x / N) * 100)}%`.padStart(4);
  console.log(`${name.padEnd(8)} complete ${p(res.complete)} expelled ${p(res.expelled)} revolt ${p(res.revolt)} | stars 0:${p(st[0])} 1:${p(st[1])} 2:${p(st[2])} 3:${p(st[3])} | avg best rank ${(rankSum / N).toFixed(1)} | reached Prem ${p(prem)} | stings/run ${(stung / N).toFixed(2)}`);
}
