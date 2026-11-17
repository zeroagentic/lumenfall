// main.js — boot and the one loop. The world advances in fixed 1/60 s steps and the renderer
// paints what is there; ?seed=N fixes the valley, ?shot=play|title|gameover|victory stages a
// screenshot scene instead of the live loop and sets window.__shotReady for the capture.
import { FIELD, LANTERN, STEP } from './config.js';
import { createRandom } from './random.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE } from './input.js';
import { createRenderer } from './render.js';
import { createWorld, PHASE, beginRun, step, startLevel, litBeacons, advanceValley } from './world.js';
import { drawHud } from './hud.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_UPGRADE, SCREEN_OVER, SCREEN_VICTORY,
  drawTitle, drawPaused, drawUpgrade, drawOver, drawVictory,
} from './screens.js';
import { stageShot } from './shots.js';
import { loadProgress, saveProgress } from './progress.js';
import * as audio from './audio.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('stage');
// the canvas is drawn at the valley's own resolution and CSS-stretched to the window, so every
// scene paints in the same 1280x720 coordinates the screenshots and the renderer assume.
canvas.width = FIELD.width;
canvas.height = FIELD.height;
const renderer = createRenderer(canvas);
const announce = document.getElementById('announce');
const progress = loadProgress();

const world = createWorld(createRandom(seed), seed);
let screen = SCREEN_TITLE;
let best = Math.max(progress.bestValley * 100 + (progress.beacons % 100), world.score);
let lastEvents = { beacons: 0, shades: 0, flares: 0, fuel: LANTERN.fuelMax, phase: PHASE.TITLE, tideWarned: false };
audio.setMuted(progress.muted);
startLevel(world, 1);

function readBest() {
  best = Math.max(best, progress.bestValley * 100 + (progress.beacons % 100));
  return best;
}

function saveBest() {
  const stats = world.victoryStats;
  progress.beacons += stats?.beacons ?? 0;
  progress.bestValley = Math.max(progress.bestValley, world.level);
  progress.bestTime = Math.min(progress.bestTime, stats?.time ?? Infinity);
  saveProgress(progress);
}

function verify(screenName) {
  if (screen === screenName) return;
  announce(screenName === SCREEN_PLAY ? 'Light your lantern. Move with WASD.' : screenName);
}

function onStep(events) {
  const nowLit = litBeacons(world);
  if (nowLit > lastEvents.beacons) audio.beaconChime();
  if (world.shadesSlain > lastEvents.shades) audio.shadeBurn();
  if (world.flaresCast > lastEvents.flares) audio.flareWhoosh();
  if (world.player.dashT > 0 && lastEvents.phase !== 'dash' && world.player.dashCd > 0.6) audio.dashWhip();
  if (world.player.fuel < lastEvents.fuel - 10) audio.hurt();
  if (world.tide > 0.72 && !lastEvents.tideWarned) { audio.tideWarn(); lastEvents.tideWarned = true; }
  if (world.tide < 0.5) lastEvents.tideWarned = false;
  if (world.phase === PHASE.OVER && lastEvents.phase !== PHASE.OVER) audio.defeatDirge();
  if (world.phase === PHASE.VICTORY && lastEvents.phase !== PHASE.VICTORY) audio.dawnFanfare();
  lastEvents = { beacons: nowLit, shades: world.shadesSlain, flares: world.flaresCast, fuel: world.player.fuel, phase: world.phase, tideWarned: lastEvents.tideWarned };
  audio.setWind(world.tide);
}

function runShot(name) {
  const scene = stageShot(name, world, seed);
  screen = scene.screen;
  best = scene.best;
  let painted = 0;
  function paint() {
    renderer.draw(world, screen, readBest());
    if (screen === SCREEN_PLAY) drawHud(renderer.ctx, world, readBest());
    if (screen === SCREEN_TITLE) drawTitle(renderer.ctx, world, readBest(), world.time);
    if (screen === SCREEN_OVER) drawOver(renderer.ctx, world, readBest());
    if (screen === SCREEN_VICTORY) drawVictory(renderer.ctx, world, readBest(), world.time);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function drawScene() {
  renderer.draw(world, screen, readBest());
  if (screen === SCREEN_PLAY) drawHud(renderer.ctx, world, readBest());
  else if (screen === SCREEN_TITLE) drawTitle(renderer.ctx, world, readBest(), world.time);
  else if (screen === SCREEN_PAUSED) drawPaused(renderer.ctx, world);
  else if (screen === SCREEN_UPGRADE) drawUpgrade(renderer.ctx, world, world.time);
  else if (screen === SCREEN_OVER) drawOver(renderer.ctx, world, readBest());
  else if (screen === SCREEN_VICTORY) drawVictory(renderer.ctx, world, readBest(), world.time);
}

function runGame() {
  const input = createInput(canvas);
  let accumulator = 0;
  let last = performance.now();
  let upgradeArmed = false;

  function announceAll(message) {
    announce.textContent = message;
  }

  function restartRun() {
    // a fresh valley on every run: reseed the world's own generator so the layout and the shade
    // waves differ, then rebuild the run from valley one
    beginRun(world);
    screen = SCREEN_PLAY;
    accumulator = 0;
    upgradeArmed = false;
    lastEvents = { beacons: 0, shades: 0, flares: 0, fuel: world.player.fuel, phase: PHASE.PLAY, tideWarned: false };
    announceAll('A new valley. Relight every beacon before the tide closes in.');
  }

  function handleActions(events) {
    if (screen === SCREEN_TITLE && (events & ACTION_CONFIRM)) {
      screen = SCREEN_PLAY;
      beginRun(world);
      announceAll('Valley one. Relight every beacon before the tide closes in.');
      upgradeArmed = false;
    } else if (screen === SCREEN_PAUSED && (events & (ACTION_CONFIRM | ACTION_PAUSE))) {
      screen = SCREEN_PLAY;
      announceAll('The valley resumes.');
    } else if (screen === SCREEN_PLAY && (events & ACTION_PAUSE)) {
      screen = SCREEN_PAUSED;
      announceAll('Paused.');
    } else if ((screen === SCREEN_OVER || screen === SCREEN_VICTORY) && (events & ACTION_CONFIRM)) {
      restartRun();
    } else if (world.phase === PHASE.UPGRADE && screen === SCREEN_PLAY && (events & ACTION_CONFIRM)) {
      screen = SCREEN_UPGRADE;
      announceAll('Choose an upgrade: 1, 2 or 3.');
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, 0.25);
    last = now;
    const events = input.takeActions();

    if (screen === SCREEN_UPGRADE) {
      // the upgrade cards answer to 1 / 2 / 3 as well as to a click on the card itself
      const pick = input.pressed.has('pick1') ? 0 : input.pressed.has('pick2') ? 1 : input.pressed.has('pick3') ? 2 : -1;
      if (pick >= 0 && world.upgradeChoices && world.upgradeChoices[pick]) {
        applyUpgradeChoice(world.upgradeChoices[pick]);
      }
      input.pressed.clear();
    }

    handleActions(events);
    while (accumulator >= STEP && (screen === SCREEN_PLAY)) {
      const beforePhase = world.phase;
      const result = step(world, STEP, input, events);
      onStep();
      if (world.phase === PHASE.UPGRADE && beforePhase !== PHASE.UPGRADE && screen === SCREEN_PLAY) {
        screen = SCREEN_UPGRADE;
        announceAll('Choose an upgrade: 1, 2 or 3.');
      }
      if (world.phase === PHASE.OVER && beforePhase !== PHASE.OVER) {
        screen = SCREEN_OVER;
        saveBest();
        announceAll(`Game over. ${world.overReason} Score ${world.victoryStats.score}.`);
      }
      if (world.phase === PHASE.VICTORY && beforePhase !== PHASE.VICTORY) {
        screen = SCREEN_VICTORY;
        saveBest();
        announceAll(`Dawn. Score ${world.victoryStats.score}.`);
      }
      accumulator -= STEP;
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_UPGRADE) {
      world.time += STEP;
      accumulator = Math.min(accumulator, 0.25);
    }
    drawScene();
    input.pressed.clear();
  }

  function applyUpgradeChoice(choice) {
    // the world owns the valley transition; the shell only follows it and says so out loud
    advanceValley(world, choice);
    screen = SCREEN_PLAY;
    announceAll(`Valley ${world.level}. The ${choice} is yours.`);
    upgradeArmed = false;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announceAll('Paused.');
    }
  });

  window.addEventListener('keydown', () => audio.unlockAudio(), { once: true });
  window.addEventListener('mousedown', () => audio.unlockAudio(), { once: true });

  announceAll('LUMENFALL. Press Space, or click the flame, to light your lantern.');
  requestAnimationFrame(frame);
}

// handleActions for menus outside play
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') event.preventDefault();
});

if (shot) runShot(shot);
else runGame();

// expose a couple of hooks for playtest scripts
window.__lumen = { world, getScreen: () => screen, getBest: () => best };