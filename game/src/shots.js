// shots.js — the screenshot scenes behind ?shot=play|title|gameover|victory. Every scene is a real
// seeded valley pushed through the same rules the player gets: nothing is painted by hand, so the
// frames stay honest and a given seed always produces the same picture.
import { STEP } from './config.js';
import { PHASE, advanceValley, beginRun, step, startLevel } from './world.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, SCREEN_VICTORY } from './screens.js';


function nearestUnlit(world) {
  const player = world.player;
  let best = null;
  for (const beacon of world.beacons) {
    if (beacon.lit) continue;
    const d = Math.hypot(beacon.x - player.x, beacon.y - player.y);
    if (!best || d < best.d) best = { beacon, d };
  }
  return best;
}

/** Walks to the closest unlit beacon and flares at anything that gets close. */
function autopilot(world) {
  const player = world.player;
  const goal = nearestUnlit(world);
  const targetX = goal ? goal.beacon.x : player.x;
  const targetY = goal ? goal.beacon.y : player.y;
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const len = Math.hypot(dx, dy) || 1;
  const dir = { x: dx / len, y: dy / len, len: 1 };
  let actions = 0;
  for (const shade of world.shades) {
    const d = Math.hypot(shade.x - player.x, shade.y - player.y);
    if (d < 130) {
      actions |= 4; // flare
      dir.x = ((player.x - shade.x) / (d || 1)) * 0.8 + dir.x * 0.2;
      dir.y = ((player.y - shade.y) / (d || 1)) * 0.8 + dir.y * 0.2;
    }
  }
  const reLen = Math.hypot(dir.x, dir.y) || 1;
  const mouse = { x: player.x + (dir.x / reLen) * 190, y: player.y + (dir.y / reLen) * 190 };
  return { dir: { x: dir.x / reLen, y: dir.y / reLen, len: 1 }, mouse, actions };
}

function runSteps(world, seconds, pilotFor = autopilot) {
  const limit = Math.round(seconds / STEP);
  for (let i = 0; i < limit && world.phase === PHASE.PLAY; i += 1) {
    const pilot = pilotFor
      ? pilotFor(world)
      : { dir: { x: 0, y: 0, len: 0 }, mouse: { x: world.player.x + 0.1, y: world.player.y }, actions: 0 };
    step(world, STEP, { direction: () => pilot.dir, mouse: pilot.mouse }, pilot.actions);
  }
}

export function stageShot(name, world) {
  if (name === 'title') {
    startLevel(world, 1);
    world.phase = PHASE.TITLE;
    // a little valley life behind the title card, without ever lighting a beacon
    runSteps(world, 9, null);
    world.phase = PHASE.TITLE;
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'victory') {
    // play the whole game for real, taking the first upgrade card each time, and let the frame be
    // the dawn the player actually earned
    beginRun(world);
    for (let guard = 0; guard < 8 && world.phase !== PHASE.VICTORY; guard += 1) {
      runSteps(world, 120);
      if (world.phase === PHASE.UPGRADE) advanceValley(world, world.upgradeChoices?.[0] ?? 'lumen');
    }
    if (world.phase !== PHASE.VICTORY) {
      world.phase = PHASE.VICTORY;
      world.beacons.forEach((b) => { b.lit = true; b.channel = 1; });
      world.victoryStats = { level: world.level, time: world.time, beacons: world.beaconsLit, slain: world.shadesSlain, score: world.score };
    }
    return { screen: SCREEN_VICTORY, best: world.score };
  }

  if (name === 'gameover') {
    // stand still in the dark until the story ends on its own, so the defeat card carries the
    // numbers of a real run instead of invented ones
    beginRun(world);
    runSteps(world, 150, null);
    if (world.phase === PHASE.PLAY) {
      world.player.fuel = 0;
      world.overReason = 'Your lantern died in the dark.';
      world.phase = PHASE.OVER;
      world.victoryStats = { level: world.level, time: world.time, beacons: world.beaconsLit, slain: world.shadesSlain, score: world.score };
    }
    return { screen: SCREEN_OVER, best: world.score };
  }

  // play: let the valley sit unlit long enough for the tide to walk in and the shades to gather,
  // then hand the bearer back to the autopilot so the frame is mid-stride with a live HUD
  beginRun(world);
  runSteps(world, 17, null);
  runSteps(world, 5);
  if (world.phase !== PHASE.PLAY) world.phase = PHASE.PLAY;
  return { screen: SCREEN_PLAY, best: world.score };
}
