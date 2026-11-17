// audio.js — all sound is made here on the fly with WebAudio: a low wind that swells with the
// tide, a beacon's chime when a pylon relights, the whistle of a flare, a shade's screech as it
// burns, the dash's whip and the final dawn motif. No samples, no files, no network.
let ctx = null;
let master = null;
let windGain = null;
let muted = false;

function ensure() {
  if (ctx) return;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.55;
  master.connect(ctx.destination);

  const windOsc = ctx.createOscillator();
  windOsc.type = 'sawtooth';
  windOsc.frequency.value = 41;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 260;
  windGain = ctx.createGain();
  windGain.gain.value = 0.02;
  windOsc.connect(windFilter).connect(windGain).connect(master);
  windOsc.start();

  const droneOsc = ctx.createOscillator();
  droneOsc.type = 'triangle';
  droneOsc.frequency.value = 82.5;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.012;
  droneOsc.connect(droneGain).connect(master);
  droneOsc.start();
}

/** Call from a user gesture (first click/keypress) so the context may start. */
export function unlockAudio() {
  ensure();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = value ? 0 : 0.55;
}

export function setWind(intensity) {
  ensure();
  if (windGain) windGain.gain.value = 0.02 + intensity * 0.05;
}

function blip(frequency, seconds, type, volume, delay = 0) {
  ensure();
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

export function beaconChime() {
  blip(523.25, 0.6, 'sine', 0.35);
  blip(659.25, 0.7, 'sine', 0.3, 0.08);
  blip(783.99, 0.9, 'sine', 0.25, 0.16);
}

export function flareWhoosh() {
  blip(220, 0.28, 'sawtooth', 0.18);
  blip(880, 0.2, 'sine', 0.12, 0.02);
}

export function shadeBurn() {
  blip(720, 0.22, 'square', 0.2);
  blip(300, 0.3, 'sawtooth', 0.16, 0.05);
}

export function dashWhip() {
  blip(680, 0.16, 'triangle', 0.22);
  blip(240, 0.2, 'sawtooth', 0.12, 0.03);
}

export function hurt() {
  blip(140, 0.4, 'sawtooth', 0.3);
  blip(90, 0.5, 'square', 0.18, 0.05);
}

export function tideWarn() {
  blip(70, 1.1, 'sine', 0.22);
}

export function dawnFanfare() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => blip(f, 1.4, 'sine', 0.3, i * 0.14));
}

export function defeatDirge() {
  [330, 262, 208, 165].forEach((f, i) => blip(f, 1.2, 'triangle', 0.25, i * 0.2));
}