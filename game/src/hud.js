// hud.js — the in-play readout: how much light is left in the lantern, how many beacons stand
// lit, how far the tide has crept, the valley's name, the score and the dash's readiness.
import { BEACON, FIELD, LANTERN, PALETTE, TIDE } from './config.js';
import { litBeacons } from './world.js';

export const VALLEY_NAMES = [
  'The Quiet Hollow',
  'Mourning Fen',
  'The Shard Reach',
  'Cinderwake',
  'Yeah — the Last Valley',
];

function bar(x, y, w, h, fill, colour, back) {
  const ctx = this;
  ctx.fillStyle = back;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(0, w * Math.min(1, Math.max(0, fill))), h, h / 2);
  ctx.fill();
}

export function drawHud(ctx, world, best) {
  const pad = 24;
  const player = world.player;

  // lantern fuel
  const fuel = player.fuel / LANTERN.fuelMax;
  const low = fuel < 0.28;
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '600 18px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('LANTERN', pad, pad + 12);
  bar.call(ctx, pad, pad + 22, 260, 16, fuel, low ? '#ff5c8a' : PALETTE.ember, 'rgba(255,255,255,0.10)');
  ctx.fillStyle = low ? '#ff5c8a' : PALETTE.flame;
  ctx.font = '700 20px ui-monospace, monospace';
  ctx.fillText(`${Math.ceil(player.fuel)} / ${LANTERN.fuelMax}`, pad + 274, pad + 37);
  if (low) {
    ctx.fillStyle = '#ff5c8a';
    ctx.font = '700 16px ui-monospace, monospace';
    ctx.fillText('LIGHT FAILING — FIND A BEACON', pad, pad + 60);
  }

  // beacons
  const lit = litBeacons(world);
  ctx.textAlign = 'right';
  const rightX = FIELD.width - pad;
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '600 18px ui-monospace, monospace';
  ctx.fillText('BEACONS', rightX, pad + 12);
  const total = world.beacons.length;
  const cell = 32;
  const startX = rightX - total * cell + 8;
  for (let i = 0; i < total; i += 1) {
    const on = i < lit;
    ctx.fillStyle = on ? PALETTE.lumen : 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.roundRect(startX + i * cell, pad + 22, 24, 24, 6);
    ctx.fill();
    if (on) {
      ctx.fillStyle = PALETTE.bloom;
      ctx.beginPath();
      ctx.arc(startX + i * cell + 12, pad + 34, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // tide
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '600 18px ui-monospace, monospace';
  ctx.fillText('THE TIDE', rightX, pad + 74);
  ctx.textAlign = 'left';
  bar.call(ctx, rightX - 260, pad + 84, 260, 16, world.tide / 1, world.tide > 0.72 ? '#ff5c8a' : PALETTE.fell, 'rgba(255,255,255,0.10)');

  // valley name and score
  const name = VALLEY_NAMES[Math.min(world.level - 1, VALLEY_NAMES.length - 1)] ?? 'The Valley';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 24px ui-monospace, monospace';
  ctx.fillText(`VALLEY ${world.level} — ${name}`, pad, FIELD.height - pad - 40);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '600 18px ui-monospace, monospace';
  ctx.fillText(`SCORE ${world.score}   BEST ${best}`, pad, FIELD.height - pad - 14);

  // dash readiness and hint
  ctx.textAlign = 'right';
  const ready = player.dashCd <= 0;
  ctx.fillStyle = ready ? PALETTE.lumen : 'rgba(255,255,255,0.25)';
  ctx.font = '700 18px ui-monospace, monospace';
  ctx.fillText(ready ? 'DASH READY' : 'DASH...', rightX, FIELD.height - pad - 40);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '600 15px ui-monospace, monospace';
  ctx.fillText('WASD move · MOUSE aim · CLICK flare · SHIFT dash · P pause', rightX, FIELD.height - pad - 14);
}