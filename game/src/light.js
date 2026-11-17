// light.js — the valley's light field: how bright each point is to the tide, used by the world
// for fuel, damage and shade behaviour, and by the renderer to carve the darkness overlay.
import { FIELD, BEACON, LANTERN } from './config.js';

/** Brightness at a point from every lit source: lantern, the aimed beam, lit beacons, flares. */
export function brightnessAt(world, x, y) {
  let value = 0;
  const player = world.player;
  const dx = x - player.x;
  const dy = y - player.y;
  const lanternDist = Math.hypot(dx, dy);
  const radius = world.lanternRadius;
  if (lanternDist < radius) value = Math.max(value, 1 - lanternDist / radius);

  const aim = world.aim;
  if (aim) {
    const beamDist = Math.abs(dx * aim.y - dy * aim.x) / Math.max(0.001, Math.hypot(aim.x, aim.y));
    if (lanternDist < radius * 1.45 && beamDist < 42) {
      value = Math.max(value, (1 - lanternDist / (radius * 1.45)) * 0.9);
    }
  }

  for (const beacon of world.beacons) {
    if (!beacon.lit) continue;
    const d = Math.hypot(x - beacon.x, y - beacon.y);
    if (d < BEACON.lightRadius) value = Math.max(value, 1 - d / BEACON.lightRadius);
  }
  for (const flare of world.flares) {
    const d = Math.hypot(x - flare.x, y - flare.y);
    if (d < flare.radius) value = Math.max(value, (1 - d / flare.radius) * 0.8);
  }
  return value;
}

/** Brightness from the valley's own light — lit beacons and flares — ignoring the bearer's own
 *  lantern. Fuel and shade behaviour read this so standing in your own lantern glow is not
 *  mistaken for standing in shelter. */
export function shelterAt(world, x, y) {
  let value = 0;
  for (const beacon of world.beacons) {
    if (!beacon.lit) continue;
    const d = Math.hypot(x - beacon.x, y - beacon.y);
    if (d < BEACON.lightRadius) value = Math.max(value, 1 - d / BEACON.lightRadius);
  }
  for (const flare of world.flares) {
    const d = Math.hypot(x - flare.x, y - flare.y);
    if (d < flare.radius) value = Math.max(value, (1 - d / flare.radius) * 0.8);
  }
  return value;
}

/** A shade is in the light and burning when any source reaches it with at least this strength. */
export function isIlluminated(world, x, y, threshold = 0.3) {
  return brightnessAt(world, x, y) >= threshold;
}