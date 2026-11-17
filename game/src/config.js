// config.js — every constant of the valley in one place: field geometry, the lantern's
// burn rates, the tide clock, shade speeds and the palette, so tuning lives here alone.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const PALETTE = {
  night: '#05070f',
  deep: '#0a1020',
  rock: '#141c2e',
  ember: '#ffb347',
  flame: '#ffd98a',
  lumen: '#7df9ff',
  bloom: '#e9fbff',
  shade: '#2a2140',
  shadeEye: '#ff5c8a',
  warden: '#4d2f5c',
  fell: '#8a6bd1',
  text: '#e8f4ff',
  dim: '#6b7fa3',
};

export const LANTERN = {
  radius: 150,
  fuelMax: 100,
  burnPerSecond: 2.4,
  flareCost: 18,
  flareSpeed: 620,
  flareLife: 0.85,
  dashCost: 12,
  dashSpeed: 780,
  dashTime: 0.22,
  dashCooldown: 0.9,
  walkSpeed: 240,
};

export const BEACON = {
  channelSeconds: 2.2, // standing inside to relight it
  lightRadius: 210,
  fuelPerSecondInLight: 16,
  countByLevel: [3, 4, 5, 6, 7],
};

export const TIDE = {
  secondsByLevel: [75, 85, 95, 110, 130],
  creepPerSecond: 9, // how fast the dark edge walks in while beacons stay unlit
  retreatPerBeacon: 260,
};

export const SHADES = {
  crawler: { speed: 52, health: 1, radius: 13, turn: 2.4 },
  leaper: { speed: 88, health: 2, radius: 15, turn: 3.6, dashEvery: 2.6, dashSpeed: 300 },
  warden: { speed: 44, health: 6, radius: 24, turn: 1.6, lightOnly: true },
};

export const PROGRESS_KEY = 'lumenfall.progress.v1';
