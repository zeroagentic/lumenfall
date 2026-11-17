// screens.js — every screen that is not play: the title with the valley's promise, the pause
// card, the three upgrade cards between valleys, the defeat card and the dawn victory card.
// Each one is drawn over the live world so the game keeps breathing behind the text.
import { FIELD, PALETTE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

const UPGRADES = {
  lumen: { name: 'LUMEN CORE', text: '+30% lantern radius' },
  ember: { name: 'EMBER FLASK', text: '-25% fuel burn' },
  lance: { name: 'FLARE LANCE', text: '+1 flare damage' },
  swift: { name: 'SWIFT STEPS', text: '+15% speed, faster dash' },
  faith: { name: 'BEACON FAITH', text: 'beacons relight 30% faster' },
};

function panel(ctx, x, y, w, h, alpha = 0.82) {
  ctx.fillStyle = `rgba(6,9,18,${alpha})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(125,249,255,0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawTitle(ctx, world, best, time) {
  ctx.textAlign = 'center';
  const cx = FIELD.width / 2;
  ctx.fillStyle = 'rgba(5,7,15,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // the lantern's promise: a flickering flame above the title
  const flick = 1 + Math.sin(time * 5.5) * 0.08 + Math.sin(time * 13) * 0.03;
  const glow = ctx.createRadialGradient(cx, 148, 8, cx, 148, 150 * flick);
  glow.addColorStop(0, 'rgba(255,217,138,0.85)');
  glow.addColorStop(0.4, 'rgba(255,179,71,0.28)');
  glow.addColorStop(1, 'rgba(255,179,71,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, 148, 150 * flick, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.flame;
  ctx.beginPath();
  ctx.ellipse(cx, 148, 13, 20 * flick, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6dd';
  ctx.beginPath();
  ctx.ellipse(cx, 152, 6, 11 * flick, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 76px ui-monospace, monospace';
  ctx.fillText('LUMENFALL', cx, 296);
  ctx.fillStyle = PALETTE.lumen;
  ctx.font = '600 20px ui-monospace, monospace';
  ctx.fillText('the valley goes dark. you are the last light left in it.', cx, 330);

  panel(ctx, cx - 350, 372, 700, 178, 0.78);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 17px ui-monospace, monospace';
  ctx.fillText('WASD / ARROWS — walk', cx, 406);
  ctx.fillText('MOUSE — aim the beam · CLICK — cast a flare', cx, 434);
  ctx.fillText('SHIFT — dash (briefly untouchable) · P — pause', cx, 462);
  ctx.fillStyle = PALETTE.ember;
  ctx.fillText('Stand inside a beacon to relight it. Light burns the shades;', cx, 494);
  ctx.fillText('flares stagger them; the Warden only dies in beacon light.', cx, 520);

  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 24px ui-monospace, monospace';
  const pulse = 0.65 + Math.sin(time * 3.4) * 0.35;
  ctx.fillStyle = `rgba(233,251,255,${pulse})`;
  ctx.fillText('PRESS SPACE TO LIGHT YOUR LANTERN', cx, 606);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '600 15px ui-monospace, monospace';
  ctx.fillText(
    `best valley reached ${best} · five valleys, then the dawn`,
    cx,
    640,
  );
}

export function drawPaused(ctx, world) {
  ctx.fillStyle = 'rgba(5,7,15,0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 54px ui-monospace, monospace';
  ctx.fillText('PAUSED', FIELD.width / 2, 320);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '600 18px ui-monospace, monospace';
  ctx.fillText('P or SPACE to keep walking', FIELD.width / 2, 364);
}

export function drawUpgrade(ctx, world, time) {
  ctx.fillStyle = 'rgba(5,7,15,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.bloom;
  ctx.font = '800 44px ui-monospace, monospace';
  ctx.fillText('THE BEACONS HOLD', FIELD.width / 2, 150);
  ctx.fillStyle = PALETTE.lumen;
  ctx.font = '600 20px ui-monospace, monospace';
  ctx.fillText(`Valley ${world.level} lit · choose what the lantern becomes`, FIELD.width / 2, 186);

  const choices = world.upgradeChoices ?? ['lumen', 'ember', 'lance'];
  const cardW = 300;
  const gap = 34;
  const totalW = choices.length * cardW + (choices.length - 1) * gap;
  let x = (FIELD.width - totalW) / 2;
  choices.forEach((key, index) => {
    const info = UPGRADES[key] ?? { name: key.toUpperCase(), text: '' };
    const bob = Math.sin(time * 2.2 + index) * 4;
    panel(ctx, x, 250 + bob, cardW, 210, 0.9);
    ctx.fillStyle = PALETTE.ember;
    ctx.font = '800 22px ui-monospace, monospace';
    ctx.fillText(`${index + 1}`, x + cardW / 2, 292 + bob);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '800 26px ui-monospace, monospace';
    ctx.fillText(info.name, x + cardW / 2, 344 + bob);
    ctx.fillStyle = PALETTE.lumen;
    ctx.font = '600 17px ui-monospace, monospace';
    ctx.fillText(info.text, x + cardW / 2, 380 + bob);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '600 14px ui-monospace, monospace';
    ctx.fillText('press the number or click', x + cardW / 2, 428 + bob);
    x += cardW + gap;
  });
}

export function drawOver(ctx, world, best) {
  ctx.fillStyle = 'rgba(12,3,14,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  const stats = world.victoryStats ?? { level: world.level, time: 0, beacons: world.beaconsLit, slain: world.shadesSlain, score: world.score };
  ctx.fillStyle = '#ff5c8a';
  ctx.font = '800 58px ui-monospace, monospace';
  ctx.fillText('THE DARK TOOK YOU', FIELD.width / 2, 250);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 22px ui-monospace, monospace';
  ctx.fillText(world.overReason, FIELD.width / 2, 292);

  panel(ctx, FIELD.width / 2 - 320, 336, 640, 150, 0.8);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 19px ui-monospace, monospace';
  ctx.fillText(`valley reached ${stats.level} · beacons relit ${stats.beacons}`, FIELD.width / 2, 376);
  ctx.fillText(`shades turned back ${stats.slain} · score ${stats.score}`, FIELD.width / 2, 408);
  ctx.fillText(`last stand ${stats.time.toFixed(1)}s · best score ${best}`, FIELD.width / 2, 440);

  ctx.fillStyle = PALETTE.bloom;
  ctx.font = '800 26px ui-monospace, monospace';
  ctx.fillText('PRESS SPACE TO TAKE UP THE LANTERN AGAIN', FIELD.width / 2, 552);
}

export function drawVictory(ctx, world, best, time) {
  const cx = FIELD.width / 2;
  const glow = ctx.createRadialGradient(cx, 300, 40, cx, 300, 620);
  glow.addColorStop(0, 'rgba(255,217,138,0.5)');
  glow.addColorStop(1, 'rgba(255,217,138,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = 'rgba(5,7,15,0.5)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.flame;
  ctx.font = '800 64px ui-monospace, monospace';
  ctx.fillText('DAWN OVER THE VALLEY', cx, 250);
  const stats = world.victoryStats ?? { level: world.level, time: 0, beacons: world.beaconsLit, slain: world.shadesSlain, score: world.score };
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 22px ui-monospace, monospace';
  ctx.fillText('every beacon burns. the tide has nowhere left to stand.', cx, 292);

  panel(ctx, cx - 340, 340, 680, 168, 0.82);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 20px ui-monospace, monospace';
  ctx.fillText(`five valleys walked · ${stats.beacons} beacons relit`, cx, 384);
  ctx.fillText(`shades turned back ${stats.slain} · score ${stats.score}`, cx, 418);
  ctx.fillText(`run time ${(stats.time / 60).toFixed(1)} min · best ${best}`, cx, 452);

  ctx.fillStyle = `rgba(233,251,255,${0.6 + Math.sin(time * 3.2) * 0.4})`;
  ctx.font = '800 24px ui-monospace, monospace';
  ctx.fillText('PRESS SPACE — WALK THE VALLEYS AGAIN', cx, 566);
}
