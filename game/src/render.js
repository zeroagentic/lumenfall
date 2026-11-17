// render.js — draws the valley: rock walls, the beacons' dormant spires and lit crowns, the
// shades with their eyes, the lantern's beam, the flares, then the darkness overlay carved by
// every light so the dark feels real, and the tide's edge closing in.
import { BEACON, FIELD, LANTERN, PALETTE, SHADES } from './config.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const dark = document.createElement('canvas');
  dark.width = FIELD.width;
  dark.height = FIELD.height;
  const dctx = dark.getContext('2d');

  function drawGround() {
    // a night cave: deepest black at the rim, a whisper of blue toward the middle so the valley
    // reads as a place instead of a void
    const amb = ctx.createRadialGradient(
      FIELD.width / 2, FIELD.height / 2, 80,
      FIELD.width / 2, FIELD.height / 2, 640,
    );
    amb.addColorStop(0, '#0c1120');
    amb.addColorStop(1, '#05070f');
    ctx.fillStyle = amb;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#111a2e';
    for (let y = 0; y < FIELD.height; y += 44) {
      for (let x = (y / 44) % 2 === 0 ? 0 : 22; x < FIELD.width; x += 44) {
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawRocks(world) {
    for (const [x, y, w, h] of world.rocks) {
      ctx.fillStyle = '#1c2740';
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 8);
      ctx.fill();
      ctx.strokeStyle = '#2c3b5e';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#253356';
      ctx.beginPath();
      ctx.roundRect(x - w / 2 + 5, y - h / 2 + 5, w * 0.5, h * 0.4, 5);
      ctx.fill();
    }
  }

  function drawBeacons(world) {
    for (const beacon of world.beacons) {
      const { x, y } = beacon;
      if (beacon.lit) {
        const pulse = 1 + Math.sin(world.time * 2.2 + x * 0.01) * 0.03;
        const glow = ctx.createRadialGradient(x, y, 6, x, y, BEACON.lightRadius * pulse);
        glow.addColorStop(0, 'rgba(125,249,255,0.55)');
        glow.addColorStop(0.35, 'rgba(125,249,255,0.18)');
        glow.addColorStop(1, 'rgba(125,249,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, BEACON.lightRadius * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e9fbff';
        ctx.beginPath();
        ctx.arc(x, y, 13 + Math.sin(world.time * 5) * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7df9ff';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const channel = beacon.channel;
        // dormant spire: an outline the dark cannot hide, with a dying ember on top
        ctx.fillStyle = '#26324f';
        ctx.beginPath();
        ctx.roundRect(x - 15, y - 15, 30, 34, 8);
        ctx.fill();
        ctx.strokeStyle = '#435a86';
        ctx.lineWidth = 2;
        ctx.stroke();
        if (channel > 0) {
          ctx.fillStyle = 'rgba(233,251,255,0.9)';
          const h = 30 * channel;
          ctx.beginPath();
          ctx.roundRect(x - 10, y - 13 + (30 - h), 20, h, 4);
          ctx.fill();
        }
        const ember = Math.max(0.6, 3.4 + Math.sin(world.time * 3 + x * 0.02) * 4.2);
        const eg = ctx.createRadialGradient(x, y + 6, 1, x, y + 6, 26);
        eg.addColorStop(0, 'rgba(255,170,92,0.85)');
        eg.addColorStop(0.4, 'rgba(255,140,60,0.22)');
        eg.addColorStop(1, 'rgba(255,140,60,0)');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(x, y + 6, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c8e6ff';
        ctx.beginPath();
        ctx.arc(x, y + 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7d93c4';
        ctx.beginPath();
        ctx.arc(x, y + 6, ember * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawShades(world) {
    for (const shade of world.shades) {
      const spec = SHADES[shade.kind];
      const wobble = Math.sin(shade.t * 6) * 1.5;
      const r = spec.radius + wobble;
      // a faint cold halo so the dark has something to push against
      const halo = ctx.createRadialGradient(shade.x, shade.y, r * 0.4, shade.x, shade.y, r * 2);
      halo.addColorStop(0, 'rgba(20,8,44,0.9)');
      halo.addColorStop(1, 'rgba(20,8,44,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(shade.x, shade.y, r * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shade.kind === 'warden' ? PALETTE.warden : PALETTE.shade;
      ctx.beginPath();
      ctx.arc(shade.x, shade.y, r, 0, Math.PI * 2);
      ctx.fill();
      // eyes toward the player
      const dx = world.player.x - shade.x;
      const dy = world.player.y - shade.y;
      const len = Math.hypot(dx, dy) || 1;
      const ex = (dx / len) * r * 0.35;
      const ey = (dy / len) * r * 0.35;
      const eyeGlow = ctx.createRadialGradient(shade.x + ex, shade.y + ey, 1, shade.x + ex, shade.y + ey, 12);
      eyeGlow.addColorStop(0, PALETTE.shadeEye);
      eyeGlow.addColorStop(0.5, 'rgba(255,58,58,0.35)');
      eyeGlow.addColorStop(1, 'rgba(255,58,58,0)');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(shade.x + ex, shade.y + ey, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.shadeEye;
      ctx.beginPath();
      ctx.arc(shade.x + ex - r * 0.28, shade.y + ey, 3.4, 0, Math.PI * 2);
      ctx.arc(shade.x + ex + r * 0.28, shade.y + ey, 3.4, 0, Math.PI * 2);
      ctx.fill();
      if (shade.kind === 'warden') {
        ctx.strokeStyle = PALETTE.fell;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(shade.x, shade.y, r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawPlayer(world) {
    const player = world.player;
    const aim = world.aim;
    // lantern glows around the player
    const glow = ctx.createRadialGradient(player.x, player.y, 4, player.x, player.y, world.lanternRadius);
    glow.addColorStop(0, 'rgba(255,217,138,0.34)');
    glow.addColorStop(0.5, 'rgba(255,179,71,0.12)');
    glow.addColorStop(1, 'rgba(255,179,71,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(player.x, player.y, world.lanternRadius, 0, Math.PI * 2);
    ctx.fill();

    // beam cone
    const cone = 0.42;
    const a0 = Math.atan2(aim.y, aim.x);
    ctx.fillStyle = 'rgba(255,217,138,0.10)';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, world.lanternRadius * 1.2, a0 - cone, a0 + cone);
    ctx.closePath();
    ctx.fill();

    // lantern bearer: small silhouette with a bright flame
    ctx.fillStyle = '#313f5e';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 5.5 + Math.sin(world.time * 7) * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9b8';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 2.6, 0, Math.PI * 2);
    ctx.fill();
    if (player.iframe > 0) {
      ctx.strokeStyle = 'rgba(125,249,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawFlares(world) {
    for (const flare of world.flares) {
      const glow = ctx.createRadialGradient(flare.x, flare.y, 2, flare.x, flare.y, flare.radius * 1.5);
      glow.addColorStop(0, 'rgba(255,217,138,0.9)');
      glow.addColorStop(0.4, 'rgba(255,179,71,0.4)');
      glow.addColorStop(1, 'rgba(255,179,71,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(flare.x, flare.y, flare.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDarkness(world) {
    dctx.clearRect(0, 0, FIELD.width, FIELD.height);
    dctx.fillStyle = 'rgba(3,5,12,0.965)';
    dctx.fillRect(0, 0, FIELD.width, FIELD.height);
    dctx.globalCompositeOperation = 'destination-out';

    function cut(x, y, radius, strength) {
      const g = dctx.createRadialGradient(x, y, radius * 0.25, x, y, radius);
      g.addColorStop(0, `rgba(0,0,0,${strength})`);
      g.addColorStop(0.75, `rgba(0,0,0,${strength * 0.65})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g;
      dctx.beginPath();
      dctx.arc(x, y, radius, 0, Math.PI * 2);
      dctx.fill();
    }

    cut(world.player.x, world.player.y, world.lanternRadius, 1);
    const aim = world.aim;
    for (let i = 0; i < 9; i += 1) {
      const t = i / 8;
      const px = world.player.x + aim.x * world.lanternRadius * 1.15 * t;
      const py = world.player.y + aim.y * world.lanternRadius * 1.15 * t;
      cut(px, py, 56 * (1 - t * 0.4), 0.55);
    }
    for (const beacon of world.beacons) {
      if (beacon.lit) {
        cut(beacon.x, beacon.y, BEACON.lightRadius, 0.92);
      } else {
        // a faint awareness: the dormant beacon reads as an objective even in the dark
        cut(beacon.x, beacon.y + 6, 46, 0.3);
      }
    }
    for (const flare of world.flares) {
      cut(flare.x, flare.y, flare.radius * 1.6, 0.85);
    }
    dctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(dark, 0, 0);
  }

  function drawTide(world) {
    if (world.tide <= 0) return;
    const edge = world.tide;
    const pulse = Math.sin(world.time * 4) * 0.018 * edge;
    const strength = 0.55 * edge;
    ctx.fillStyle = `rgba(30,10,44,${strength})`;
    const inset = (1 - edge) * 260;
    ctx.fillRect(0, 0, FIELD.width, inset + pulse);
    ctx.fillRect(0, FIELD.height - inset - pulse, FIELD.width, inset);
    ctx.fillRect(0, 0, inset + pulse, FIELD.height);
    ctx.fillRect(FIELD.width - inset - pulse, 0, inset, FIELD.height);
  }

  function draw(world, screen, best) {
    drawGround();
    drawRocks(world);
    drawBeacons(world);
    drawFlares(world);
    drawPlayer(world, screen, best);
    drawShades(world);
    drawDarkness(world);
    drawTide(world);
  }

  return { draw, ctx };
}