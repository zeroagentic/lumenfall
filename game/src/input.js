// input.js — keyboard and mouse state flattened into a tiny action vector each frame:
// movement direction, aim point, and the one-shot flags flare/dash/confirm/pause.
// Confirmation is used by every menu (start, upgrade, game over, victory).

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_FLARE = 4;
export const ACTION_DASH = 8;

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'confirm', KeyE: 'confirm', Enter: 'confirm',
  KeyP: 'pause', Escape: 'pause',
  ShiftLeft: 'dash', ShiftRight: 'dash',
  Digit1: 'pick1', Digit2: 'pick2', Digit3: 'pick3',
  Numpad1: 'pick1', Numpad2: 'pick2', Numpad3: 'pick3',
};

export function createInput(canvas) {
  const keys = { left: false, right: false, up: false, down: false };
  const pressed = new Set();
  const mouse = { x: 0, y: 0, down: false };
  let queued = 0;

  const onKeyDown = (event) => {
    const name = KEYMAP[event.code];
    if (!name) return;
    event.preventDefault();
    if (name === 'left' || name === 'right' || name === 'up' || name === 'down') {
      keys[name] = true;
    } else if (!event.repeat) {
      queued |= name === 'confirm' ? ACTION_CONFIRM : name === 'pause' ? ACTION_PAUSE : ACTION_DASH;
    }
    pressed.add(name);
  };
  const onKeyUp = (event) => {
    const name = KEYMAP[event.code];
    if (!name) return;
    if (name === 'left' || name === 'right' || name === 'up' || name === 'down') keys[name] = false;
  };
  const onMouseMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
  };
  const onMouseDown = (event) => {
    if (event.button === 0) {
      mouse.down = true;
      queued |= ACTION_FLARE;
    }
  };
  const onMouseUp = (event) => {
    if (event.button === 0) mouse.down = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  function takeActions() {
    const out = queued;
    queued = 0;
    return out;
  }

  function direction() {
    let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; }
    return { x, y, len };
  }

  return { takeActions, direction, mouse, pressed, destroy() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
  } };
}