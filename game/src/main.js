// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. The game moves between six
// screens: title, play, paused, round clear, time up and festival complete.
//
// ?seed=N fixes the stars and petals. ?shot=start|play|hint|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, BUTTONS, CROSSHAIR_SPEED, FIELD, PANEL } from './config.js';
import { createRandom } from './random.js';
import { createLayout } from './scene.js';
import { createWorld, clickAt, startGame, startRound, tick, useHint, EVENT_FOUND, EVENT_ROUND_CLEAR, EVENT_TIME_UP, EVENT_WRONG } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_CLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { createSound } from './sound.js';
import { SHOT_TIME, stageShot } from './shots.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(seed);
const layout = createLayout(seed);
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

// A handle for play-testing: the state, the layout and the panel geometry.
window.__game = { state: world, layout, panel: PANEL, seed };

function runShot(name) {
  const screen = stageShot(name, world);
  const best = readBest();
  let painted = 0;
  function paint() {
    renderer.draw(world, screen, best, layout, SHOT_TIME);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, (x, y) => renderer.toLogical(x, y));
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let lastTickSecond = -1;

  function announce(message) {
    status.textContent = message;
  }

  function recordBest() {
    if (world.score > best) {
      best = world.score;
      saveBest(best);
    }
  }

  function beginRound(roundIndex) {
    startRound(world, roundIndex);
    screen = SCREEN_PLAY;
    lastTickSecond = -1;
    sound.roundStart();
    announce(`Round ${roundIndex + 1}. Find 8 differences.`);
  }

  function handleTap(x, y) {
    sound.unlock();
    if (screen === SCREEN_TITLE) {
      startGame(world);
      screen = SCREEN_PLAY;
      sound.roundStart();
      announce('Playing. Find 8 differences.');
      return;
    }
    if (screen === SCREEN_CLEAR) {
      beginRound(world.roundIndex + 1);
      return;
    }
    if (screen === SCREEN_OVER) {
      world.score = world.scoreAtRoundStart;
      beginRound(world.roundIndex);
      return;
    }
    if (screen === SCREEN_WIN) {
      startGame(world);
      screen = SCREEN_PLAY;
      sound.roundStart();
      announce('Playing. Find 8 differences.');
      return;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    const hint = BUTTONS.hint;
    if (x >= hint.x && x <= hint.x + hint.w && y >= hint.y && y <= hint.y + hint.h) {
      if (useHint(world)) sound.hint();
      return;
    }
    const pause = BUTTONS.pause;
    if (x >= pause.x && x <= pause.x + pause.w && y >= pause.y && y <= pause.y + pause.h) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    const events = clickAt(world, x, y);
    if (events & EVENT_FOUND) {
      sound.find();
      announce(`${8 - world.found.size} differences left.`);
    } else if (events & EVENT_WRONG) {
      sound.wrong();
      announce('Not a difference. Three seconds lost.');
    }
    if (events & EVENT_ROUND_CLEAR) {
      recordBest();
      sound.win();
      screen = world.screen;
      announce(world.screen === SCREEN_WIN ? 'Festival complete!' : 'Round clear!');
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) {
      if (useHint(world)) sound.hint();
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (actions & ACTION_CONFIRM) {
      sound.unlock();
      if (screen === SCREEN_TITLE) {
        startGame(world);
        screen = SCREEN_PLAY;
        sound.roundStart();
        announce('Playing. Find 8 differences.');
      } else if (screen === SCREEN_CLEAR) {
        beginRound(world.roundIndex + 1);
      } else if (screen === SCREEN_OVER) {
        world.score = world.scoreAtRoundStart;
        beginRound(world.roundIndex);
      } else if (screen === SCREEN_WIN) {
        startGame(world);
        screen = SCREEN_PLAY;
        sound.roundStart();
        announce('Playing. Find 8 differences.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
  }

  function moveCrosshair(dt) {
    const held = input.held;
    let dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    let dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    if (dx === 0 && dy === 0) return;
    const crosshair = world.crosshair;
    crosshair.keyboard = true;
    const length = Math.hypot(dx, dy);
    crosshair.x = Math.min(FIELD.width - 8, Math.max(8, crosshair.x + (dx / length) * CROSSHAIR_SPEED * dt));
    crosshair.y = Math.min(FIELD.height - 8, Math.max(8, crosshair.y + (dy / length) * CROSSHAIR_SPEED * dt));
  }

  function step(dt) {
    if (screen !== SCREEN_PLAY) return;
    const events = tick(world, dt);
    if (events & EVENT_TIME_UP) {
      recordBest();
      screen = SCREEN_OVER;
      announce('Time is up.');
    }
    const whole = Math.ceil(world.timeLeft);
    if (world.timeLeft <= 10.5 && whole !== lastTickSecond) {
      lastTickSecond = whole;
      sound.tick();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    // The world's screen mirrors the loop's screen, so taps and the debug
    // handle always see the screen the game is actually on.
    world.screen = screen;
    moveCrosshair(dt);
    handleActions();
    for (const tap of input.takeTaps()) {
      if (world.crosshair.keyboard) {
        // A pointer tap hands control back to the mouse.
        world.crosshair.keyboard = false;
      }
      handleTap(tap.x, tap.y);
    }
    if (screen === SCREEN_PLAY) {
      accumulator += dt;
      while (accumulator >= STEP) {
        step(STEP);
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) {
          accumulator = 0;
          break;
        }
      }
    } else {
      accumulator = 0;
      world.elapsed += dt;
    }
    // Keep the pointer ring following the mouse.
    world.mouse.x = input.pointer.x;
    world.mouse.y = input.pointer.y;
    world.mouse.inside = input.pointer.inside;
    renderer.draw(world, screen, best, layout, world.elapsed);
  }

  // Leaving the tab pauses a running game rather than letting the clock run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Lantern Night. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
