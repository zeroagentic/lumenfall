// main.js — boot and the one loop. The world advances in fixed 1/60 s steps and the renderer
// paints what is there; ?seed=N fixes the valley, ?shot=start|play|end stages a screenshot scene.
import { FIELD, PALETTE, STEP } from './config.js';
import { createRandom } from './random.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const announce = document.getElementById('announce');

let random = createRandom(seed);

function resize() {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
}

function draw() {
  ctx.fillStyle = PALETTE.night;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function frame() {
  requestAnimationFrame(frame);
  draw();
}

resize();
announce.textContent = 'LUMENFALL. Press Space to begin.';
requestAnimationFrame(frame);
