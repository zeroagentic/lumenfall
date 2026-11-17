// progress.js — the lantern-bearer's record kept on this machine: best valley reached,
// total beacons relit, best time, and the sound preference. Nothing leaves the browser.
import { PROGRESS_KEY } from './config.js';

export function loadProgress() {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { bestValley: 0, beacons: 0, bestTime: Infinity, muted: false };
    const data = JSON.parse(raw);
    return {
      bestValley: Number(data.bestValley) || 0,
      beacons: Number(data.beacons) || 0,
      bestTime: Number.isFinite(data.bestTime) ? data.bestTime : Infinity,
      muted: Boolean(data.muted),
    };
  } catch {
    return { bestValley: 0, beacons: 0, bestTime: Infinity, muted: false };
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // storage off (private windows): the record lasts this visit only
  }
}