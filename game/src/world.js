// world.js — the simulation. One fixed 1/60 s step advances the valley: the lantern's fuel, the
// tide's creep, the beacons' channel, the shades' hunt and every flare. Everything is seeded, so
// a valley plays the same twice and the screenshot scenes replay exactly.
import { BEACON, FIELD, LANTERN, SHADES, STEP, TIDE } from './config.js';
import { createRandom, between } from './random.js';
import { isIlluminated, shelterAt } from './light.js';

export const PHASE = { TITLE: 0, PLAY: 1, PAUSED: 2, UPGRADE: 3, OVER: 4, VICTORY: 5 };

export const ROCKS_BY_LEVEL = [
  [],
  [[300, 180, 46, 30], [980, 540, 40, 26]],
  [[160, 520, 40, 30], [1120, 180, 38, 28], [640, 120, 46, 26]],
  [[240, 400, 44, 34], [1040, 380, 40, 36], [420, 150, 34, 30], [860, 600, 36, 28]],
  [[200, 220, 42, 30], [1080, 240, 42, 30], [260, 580, 40, 34], [1020, 560, 44, 30], [640, 380, 50, 36]],
];

export function createWorld(random, seed) {
  const world = {
    seed,
    random,
    phase: PHASE.TITLE,
    level: 0,
    time: 0,
    score: 0,
    beaconsLit: 0,
    shadesSlain: 0,
    flaresCast: 0,
    bestTime: 0,
    tide: 0,
    tideRate: TIDE.creepPerSecond,
    spawnTimer: 2,
    wardenActive: false,
    rocks: [],
    beacons: [],
    shades: [],
    flares: [],
    lanternRadius: LANTERN.radius,
    fuelRate: LANTERN.burnPerSecond,
    flareDamage: 1,
    walkSpeed: LANTERN.walkSpeed,
    dashCooldown: LANTERN.dashCooldown,
    channelFactor: 1,
    aim: { x: 1, y: 0 },
    player: { x: FIELD.width / 2, y: FIELD.height / 2, vx: 0, vy: 0, r: 14, fuel: LANTERN.fuelMax, dashT: 0, dashCd: 0, iframe: 0 },
    overReason: '',
    victoryStats: null,
  };
  return world;
}

export function startLevel(world, level) {
  const random = world.random;
  world.level = level;
  world.time = 0;
  world.tide = 0;
  // each valley has its own clock: the tide crosses the valley in this many seconds of unlit time
  const clock = TIDE.secondsByLevel[Math.min(level, TIDE.secondsByLevel.length) - 1];
  world.tideRate = 1000 / clock;
  world.spawnTimer = 2.4;
  world.wardenActive = false;
  world.shades = [];
  world.flares = [];
  world.rocks = ROCKS_BY_LEVEL[Math.min(level, ROCKS_BY_LEVEL.length - 1)];

  const count = BEACON.countByLevel[Math.min(level, BEACON.countByLevel.length) - 1];
  world.beacons = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + between(random, -0.25, 0.25);
    const dist = between(random, 260, Math.min(430, 320 + level * 16));
    world.beacons.push({
      x: FIELD.width / 2 + Math.cos(angle) * dist,
      y: FIELD.height / 2 + Math.sin(angle) * dist,
      lit: false,
      channel: 0,
    });
  }
  world.player.x = FIELD.width / 2;
  world.player.y = FIELD.height / 2;
  world.player.fuel = LANTERN.fuelMax;
  world.player.vx = 0;
  world.player.vy = 0;
  world.player.dashT = 0;
  world.player.dashCd = 0;
  world.player.iframe = 0;
}

export function beginRun(world) {
  world.level = 0;
  world.score = 0;
  world.beaconsLit = 0;
  world.shadesSlain = 0;
  world.flaresCast = 0;
  startLevel(world, 1);
  world.phase = PHASE.PLAY;
}

export function applyUpgrade(world, upgrade) {
  if (upgrade === 'lumen') world.lanternRadius *= 1.3;
  if (upgrade === 'ember') world.fuelRate *= 0.75;
  if (upgrade === 'lance') world.flareDamage += 1;
  if (upgrade === 'swift') { world.walkSpeed *= 1.15; world.dashCooldown *= 0.75; }
  if (upgrade === 'faith') world.channelFactor *= 0.7;
}

/** Applies an upgrade and opens the next valley. One place owns the transition so the game and the
 *  screenshot scenes can never drift apart on what "next valley" means. */
export function advanceValley(world, choice) {
  applyUpgrade(world, choice);
  startLevel(world, world.level + 1);
  world.phase = PHASE.PLAY;
  return world.level;
}

export function litBeacons(world) {
  return world.beacons.filter((b) => b.lit).length;
}

function spawnShade(world) {
  const random = world.random;
  const level = world.level;
  let kind = 'crawler';
  const roll = random();
  if (level >= 2 && roll < 0.3) kind = 'leaper';
  if (level >= 3 && roll < 0.12 && !world.wardenActive) kind = 'warden';
  if (kind === 'warden') world.wardenActive = true;

  const angle = between(random, 0, Math.PI * 2);
  const dist = 560 + between(random, 0, 120);
  const spec = SHADES[kind];
  world.shades.push({
    kind,
    x: world.player.x + Math.cos(angle) * dist,
    y: world.player.y + Math.sin(angle) * dist,
    vx: 0,
    vy: 0,
    hp: spec.health,
    r: spec.radius,
    t: between(random, 0, 10),
    state: 'seek',
    stateT: 0,
    lungeT: 0,
  });
}

function illuminateDamage(world, dt) {
  const player = world.player;
  for (let i = world.shades.length - 1; i >= 0; i -= 1) {
    const shade = world.shades[i];
    const burning = isIlluminated(world, shade.x, shade.y, shade.kind === 'warden' ? 0.7 : 0.35);
    if (burning) {
      shade.hp -= (shade.kind === 'warden' ? 1.1 : 2.2) * dt * 3;
      if (shade.hp <= 0) {
        world.shades.splice(i, 1);
        world.shadesSlain += 1;
        world.score += shade.kind === 'warden' ? 30 : 10;
        if (shade.kind === 'warden') world.wardenActive = false;
      }
    }
  }
}

export function step(world, dt, input, actions) {
  // the world only advances while a valley is being played; menus live in main.js so a confirm
  // press can never both advance a valley here and again in the screen logic
  if (world.phase === PHASE.PLAY) stepPlay(world, dt, input, actions);
}

function stepPlay(world, dt, input, actions) {
  world.time += dt;
  const player = world.player;

  player.dashCd = Math.max(0, player.dashCd - dt);
  player.iframe = Math.max(0, player.iframe - dt);

  if (actions & 8 && player.dashCd <= 0 && (input.direction().len > 0 || true)) {
    const dir = input.direction().len > 0 ? input.direction() : { x: world.aim.x, y: world.aim.y, len: 1 };
    player.vx = dir.x * LANTERN.dashSpeed;
    player.vy = dir.y * LANTERN.dashSpeed;
    player.dashT = LANTERN.dashTime;
    player.dashCd = world.dashCooldown;
    player.iframe = Math.max(player.iframe, 0.28);
  }

  if (player.dashT > 0) {
    player.dashT -= dt;
  } else {
    const dir = input.direction();
    player.vx = dir.x * world.walkSpeed;
    player.vy = dir.y * world.walkSpeed;
  }

  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.x = Math.max(22, Math.min(FIELD.width - 22, player.x));
  player.y = Math.max(22, Math.min(FIELD.height - 22, player.y));

  // aim follows the mouse; keep a last-used aim so an idling mouse still shows a beam
  if (input.mouse && Math.hypot(input.mouse.x, input.mouse.y) > 0) {
    const dx = input.mouse.x - player.x;
    const dy = input.mouse.y - player.y;
    const len = Math.hypot(dx, dy) || 1;
    world.aim = { x: dx / len, y: dy / len };
  }

  if (actions & 4) fireFlare(world);
  for (let i = world.flares.length - 1; i >= 0; i -= 1) {
    const flare = world.flares[i];
    flare.t -= dt;
    flare.x += flare.vx * dt;
    flare.y += flare.vy * dt;
    for (const shade of world.shades) {
      const d = Math.hypot(shade.x - flare.x, shade.y - flare.y);
      if (d < shade.r + flare.radius) {
        shade.hp -= world.flareDamage;
        if (shade.kind !== 'warden') {
          const nx = (shade.x - flare.x) / (d || 1);
          shade.vx += nx * 160;
          shade.vy += nx * 160;
        }
        flare.t = Math.min(flare.t, 0.02);
      }
    }
    if (flare.t <= 0) world.flares.splice(i, 1);
  }

  // beacons: channel when standing inside an unlit one
  for (const beacon of world.beacons) {
    if (beacon.lit) continue;
    const d = Math.hypot(player.x - beacon.x, player.y - beacon.y);
    if (d < 46) {
      beacon.channel += dt / (BEACON.channelSeconds * world.channelFactor);
      if (beacon.channel >= 1) {
        beacon.lit = true;
        beacon.channel = 1;
        world.beaconsLit += 1;
        world.score += 25;
        world.tide = Math.max(0, world.tide - TIDE.retreatPerBeacon / 1000);
      }
    } else {
      beacon.channel = Math.max(0, beacon.channel - dt * 1.4);
    }
  }

  // the tide never stops: it walks in on the valley's clock, and every beacon you relight buys
  // back a slice of ground. Standing still to admire the lantern loses the valley.
  world.tide += (world.tideRate / 1000) * dt;

  // fuel: drains always, faster in the dark, refilled by standing in light
  const litHere = brightnessNow(world, player.x, player.y);
  const drain = world.fuelRate * (litHere > 0.25 ? (litHere > 0.5 ? 0.35 : 0.7) : 1.35);
  player.fuel -= drain * dt;
  player.fuel = Math.min(LANTERN.fuelMax, player.fuel + litHere * BEACON.fuelPerSecondInLight * dt);
  if (player.fuel <= 0) { player.fuel = 0; endRun(world, 'Your lantern died in the dark.'); return; }
  if (world.tide >= 1) { endRun(world, 'The tide swallowed the valley.'); return; }

  // shades
  world.spawnTimer -= dt;
  const maxShades = Math.min(14 + levelCap(world) * 2, 24);
  if (world.spawnTimer <= 0 && world.shades.length < maxShades) {
    spawnShade(world);
    world.spawnTimer = Math.max(1.1, 3.0 - world.time * 0.012);
  }
  stepShades(world, dt);

  illuminateDamage(world, dt);

  // collision with shades
  for (const shade of world.shades) {
    const d = Math.hypot(player.x - shade.x, player.y - shade.y);
    if (d < player.r + shade.r && player.iframe <= 0) {
      player.fuel -= shade.kind === 'warden' ? 26 : 14;
      player.iframe = 0.9;
      const nx = (player.x - shade.x) / (d || 1);
      player.x += nx * 26;
      player.y += nx * 26;
      if (player.fuel <= 0) { player.fuel = 0; endRun(world, 'The dark drank your light.'); return; }
    }
  }

  // victory check
  if (litBeacons(world) === world.beacons.length) {
    world.beaconsLit += 0; // count once
    if (world.level >= 5) {
      winRun(world);
    } else {
      world.phase = PHASE.UPGRADE;
      world.upgradeChoices = rollUpgrades(world);
    }
  }
}

function levelCap(world) {
  return world.level;
}

function brightnessNow(world, x, y) {
  // what shelters the bearer: lit beacons and flares, never the lantern they are carrying
  return shelterAt(world, x, y);
}

function stepShades(world, dt) {
  const player = world.player;
  for (const shade of world.shades) {
    shade.t += dt;
    const dx = player.x - shade.x;
    const dy = player.y - shade.y;
    const dist = Math.hypot(dx, dy) || 1;
    const spec = SHADES[shade.kind];

    if (shade.kind === 'crawler') {
      shade.x += (dx / dist) * spec.speed * dt;
      shade.y += (dy / dist) * spec.speed * dt;
    } else if (shade.kind === 'leaper') {
      shade.stateT -= dt;
      if (shade.state === 'seek' && shade.stateT <= 0) {
        shade.state = 'lunge';
        shade.stateT = 0.32;
        shade.lungeT = 0.32;
        shade.lungeDir = { x: dx / dist, y: dy / dist };
      } else if (shade.state === 'lunge') {
        shade.x += shade.lungeDir.x * spec.dashSpeed * dt;
        shade.y += shade.lungeDir.y * spec.dashSpeed * dt;
        if (shade.stateT <= 0) { shade.state = 'seek'; shade.stateT = between(world.random, 1.0, 2.2); }
      } else {
        // circle the player at range, then go back to seek next cycle
        const angle = Math.atan2(dy, dx) + 1.1;
        shade.x += Math.cos(angle) * spec.speed * dt;
        shade.y += Math.sin(angle) * spec.speed * dt;
        shade.stateT = 1.4;
        shade.state = 'seek';
      }
    } else {
      // warden: slow, relentless, immune to flares, killed only by beacon light
      shade.x += (dx / dist) * spec.speed * dt;
      shade.y += (dy / dist) * spec.speed * dt;
    }

    shade.x = Math.max(18, Math.min(FIELD.width - 18, shade.x));
    shade.y = Math.max(18, Math.min(FIELD.height - 18, shade.y));
  }
}

function fireFlare(world) {
  if (world.player.fuel < LANTERN.flareCost) return;
  world.player.fuel -= LANTERN.flareCost;
  world.flaresCast += 1;
  const aim = world.aim;
  world.flares.push({
    x: world.player.x + aim.x * 26,
    y: world.player.y + aim.y * 26,
    vx: aim.x * LANTERN.flareSpeed,
    vy: aim.y * LANTERN.flareSpeed,
    t: LANTERN.flareLife,
    radius: 20,
  });
}

function rollUpgrades(world) {
  const pool = ['lumen', 'ember', 'lance', 'swift', 'faith'];
  const random = world.random;
  const out = [];
  while (out.length < 3) {
    const pick = pool[Math.floor(random() * pool.length)];
    if (!out.includes(pick)) out.push(pick);
  }
  return out;
}

function advanceAfterUpgrade(world) {
  startLevel(world, world.level + 1);
  world.phase = PHASE.PLAY;
}

function endRun(world, reason) {
  world.phase = PHASE.OVER;
  world.overReason = reason;
  world.bestTime = world.time;
  world.victoryStats = { level: world.level, time: world.time, beacons: world.beaconsLit, slain: world.shadesSlain, score: world.score };
}

function winRun(world) {
  world.phase = PHASE.VICTORY;
  world.bestTime = world.time;
  world.victoryStats = { level: world.level, time: world.time, beacons: world.beaconsLit, slain: world.shadesSlain, score: world.score };
}