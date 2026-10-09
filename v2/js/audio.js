// Sound for v2, synthesised live with the Web Audio API: no audio files, no
// licences, nothing fetched. Music is an 80s cop-show loop that adds layers as
// the Heat rises; effects are short synth blips, noise sweeps and glides.
// Browsers only allow audio after a user gesture, so call unlock() from a click.

let ctx = null;
let master, musicBus, musicFilter, sfxBus, noiseBuf;
let mode = 'all'; // all | sfx | off
let timer = 0;
let nextTime = 0;
let step = 0;
let level = 0;
let bpm = 108;
let hot = false; // hysteresis for the "heat is on" sting

const A2 = 110;
const ROOTS = [A2, 87.31, 98, 82.41];              // Am - F - G - E
const CHORDS = [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66], [164.81, 207.65, 246.94]];
const BASS = [1, 1, 2, 1, 1, 1, 2, 1.5];            // eighth-note pattern, as multiples of the root

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
  sfxBus = ctx.createGain();
  sfxBus.connect(master);
  musicFilter = ctx.createBiquadFilter();
  musicFilter.type = 'lowpass';
  musicFilter.frequency.value = 18000;
  musicFilter.connect(master);
  musicBus = ctx.createGain();
  musicBus.connect(musicFilter);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  applyMode();
  return ctx;
}

function applyMode() {
  if (!ctx) return;
  musicBus.gain.value = mode === 'all' ? 0.32 : 0;
  sfxBus.gain.value = mode === 'off' ? 0 : 1;
}

export function setMode(m) { mode = m; applyMode(); }
export const getMode = () => mode;

export function unlock() {
  if (ensure() && ctx.state === 'suspended') ctx.resume();
}
export function suspend(on) {
  if (!ctx) return;
  if (on) ctx.suspend(); else ctx.resume();
}

// --- building blocks -----------------------------------------------------------
function tone(freq, at, dur, { type = 'square', gain = 0.15, bus = sfxBus, slideTo = 0, attack = 0.005 } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(bus);
  o.start(at);
  o.stop(at + dur + 0.02);
}

function noise(at, dur, { gain = 0.2, freq = 2000, type = 'bandpass', sweepTo = 0, bus = sfxBus } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, at);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, at + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(bus);
  src.start(at);
  src.stop(at + dur + 0.02);
}

const ready = () => ctx && mode !== 'off';
const now = () => ctx.currentTime + 0.01;

// --- effects -------------------------------------------------------------------
export function coin() {
  if (!ready()) return;
  const t = now();
  tone(988, t, 0.07, { gain: 0.1 });
  tone(1319, t + 0.07, 0.14, { gain: 0.1 });
}

export function bigCash() {
  if (!ready()) return;
  const t = now();
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, t + i * 0.055, 0.16, { gain: 0.09 }));
  noise(t, 0.3, { gain: 0.05, freq: 6000, type: 'highpass' });
}

export function shred() {
  if (!ready()) return;
  noise(now(), 0.22, { gain: 0.3, freq: 4000, sweepTo: 600 });
}

export function leak() {
  if (!ready()) return;
  const t = now();
  tone(140, t, 0.35, { type: 'sine', gain: 0.35, slideTo: 50 });
  tone(466.16, t, 0.3, { type: 'sawtooth', gain: 0.05 });
  tone(493.88, t, 0.3, { type: 'sawtooth', gain: 0.05 });
}

export function cardIn() {
  if (!ready()) return;
  const t = now();
  noise(t, 0.18, { gain: 0.08, freq: 800, sweepTo: 3000 });
  tone(392, t + 0.05, 0.25, { type: 'triangle', gain: 0.12 });
}

export function click() {
  if (!ready()) return;
  tone(660, now(), 0.05, { type: 'triangle', gain: 0.12 });
}

export function gavel() {
  if (!ready()) return;
  const t = now();
  for (let i = 0; i < 3; i++) {
    tone(180, t + i * 0.28, 0.12, { type: 'sine', gain: 0.4, slideTo: 90 });
    noise(t + i * 0.28, 0.05, { gain: 0.25, freq: 1200 });
  }
}

export function whistle(long = false) {
  if (!ready()) return;
  const t = now();
  const blasts = long ? [[0, 0.25], [0.35, 0.25], [0.7, 0.7]] : [[0, 0.45]];
  for (const [at, dur] of blasts) {
    const o = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    const g = ctx.createGain();
    o.frequency.value = 2900;
    lfo.frequency.value = 38; // the pea rattling
    depth.gain.value = 140;
    lfo.connect(depth).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t + at);
    g.gain.exponentialRampToValueAtTime(0.07, t + at + 0.02);
    g.gain.setValueAtTime(0.07, t + at + dur - 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
    o.connect(g).connect(sfxBus);
    o.start(t + at); lfo.start(t + at);
    o.stop(t + at + dur + 0.02); lfo.stop(t + at + dur + 0.02);
  }
}

export function fanfare() {
  if (!ready()) return;
  const t = now();
  const notes = [[523.25, 0, 0.12], [523.25, 0.14, 0.12], [523.25, 0.28, 0.12], [698.46, 0.42, 0.5], [880, 0.42, 0.5]];
  for (const [f, at, dur] of notes) tone(f, t + at, dur, { type: 'sawtooth', gain: 0.08, attack: 0.02 });
}

export function sadTrombone() {
  if (!ready()) return;
  const t = now();
  [[392, 370], [370, 349], [349, 330]].forEach(([a, b], i) => tone(a, t + i * 0.42, 0.38, { type: 'sawtooth', gain: 0.09, slideTo: b, attack: 0.03 }));
  tone(330, t + 1.26, 1.1, { type: 'sawtooth', gain: 0.09, slideTo: 262, attack: 0.03 });
}

// The "heat is on" moment: a riser into two brass stabs.
export function heatSting() {
  if (!ctx || mode !== 'all') return;
  const t = now();
  noise(t, 0.6, { gain: 0.12, freq: 400, sweepTo: 6000, bus: musicBus });
  for (const at of [0.6, 0.9]) {
    for (const f of [220, 261.63, 329.63, 440]) tone(f, t + at, 0.22, { type: 'sawtooth', gain: 0.07, bus: musicBus, attack: 0.01 });
  }
}

// --- music ---------------------------------------------------------------------
function playStep(s, at) {
  const bar = Math.floor(s / 16) % 4;
  const s16 = s % 16;
  const root = ROOTS[bar];
  const sixteenth = 60 / bpm / 4;

  if (s16 % 2 === 0) {
    tone(root * BASS[s16 / 2], at, sixteenth * 1.8, { type: 'triangle', gain: 0.5, bus: musicBus });
    if (level >= 1) tone(root * BASS[s16 / 2] / 2, at, sixteenth * 1.6, { type: 'square', gain: 0.08, bus: musicBus });
  }
  const hat = level >= 3 ? true : s16 % 4 === 2;
  if (hat) noise(at, 0.04, { gain: level >= 3 ? 0.06 : 0.08, freq: 8000, type: 'highpass', bus: musicBus });

  if (level >= 1 && s16 % 4 === 0) tone(150, at, 0.22, { type: 'sine', gain: 0.6, slideTo: 40, bus: musicBus });
  if (level >= 1 && (s16 === 4 || s16 === 12)) {
    noise(at, 0.14, { gain: 0.25, freq: 1800, bus: musicBus });
    tone(190, at, 0.08, { type: 'triangle', gain: 0.15, bus: musicBus });
  }
  if (level >= 2 && (s16 === 0 || s16 === 6 || s16 === 10)) {
    for (const f of CHORDS[bar]) tone(f, at, sixteenth * 1.5, { type: 'sawtooth', gain: 0.05, bus: musicBus });
  }
  if (level >= 3 && s16 === 0) {
    tone(root * 4, at, sixteenth * 15, { type: 'sawtooth', gain: 0.035, slideTo: root * 6, bus: musicBus, attack: 0.1 });
  }
}

function schedule() {
  while (nextTime < ctx.currentTime + 0.12) {
    playStep(step, nextTime);
    nextTime += 60 / bpm / 4;
    step++;
  }
}

export function startMusic() {
  if (!ensure() || timer) return;
  nextTime = ctx.currentTime + 0.05;
  step = 0;
  hot = false;
  timer = setInterval(schedule, 25);
}

export function stopMusic() {
  if (timer) clearInterval(timer);
  timer = 0;
}

// Heat drives the layers and tempo; crossing 50 fires the sting once.
export function setHeat(heat) {
  level = heat >= 80 ? 3 : heat >= 55 ? 2 : heat >= 30 ? 1 : 0;
  bpm = 108 + heat * 0.24;
  if (!hot && heat >= 50) { hot = true; heatSting(); }
  else if (hot && heat < 35) hot = false;
}

// Muffle the music while paused or a card is on screen.
let ducked = false;
export function duck(on) {
  if (!ctx || on === ducked) return;
  ducked = on;
  musicFilter.frequency.setTargetAtTime(on ? 650 : 18000, ctx.currentTime, 0.08);
}
