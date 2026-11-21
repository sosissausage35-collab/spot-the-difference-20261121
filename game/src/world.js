// The game state and its rules: rounds, the clock, scoring, hints, wrong clicks.
// Nothing here draws anything — it only answers what happened, so the renderer
// and the sounds can react. A tap lands in panel coordinates; `clickAt` works
// out which panel it was in and whether a difference hides there.

import { LEVELS, differenceIds } from './levels.js';
import { HINTS_PER_ROUND, HINT_SECONDS, MARK_POP_SECONDS, SCORE, WRONG_FLASH_SECONDS, WRONG_TIME_COST } from './config.js';

export const EVENT_NONE = 0;
export const EVENT_FOUND = 1;
export const EVENT_WRONG = 2;
export const EVENT_ROUND_CLEAR = 4;
export const EVENT_TIME_UP = 8;
export const EVENT_HINT = 16;

/** A fresh state for a game of `seed`. */
export function createWorld(seed) {
  return {
    seed,
    screen: 'title',
    roundIndex: 0,
    found: new Set(),
    foundAt: new Map(),
    score: 0,
    roundScore: 0,
    streak: 0,
    timeLeft: LEVELS[0].time,
    hintsLeft: HINTS_PER_ROUND,
    hint: null,
    wrongFlash: null,
    mouse: { x: -1, y: -1, inside: false },
    crosshair: { x: 320, y: 400, keyboard: false },
    roundBreakdown: null,
    totalBreakdown: null,
    scoreAtRoundStart: 0,
    elapsed: 0,
  };
}

export function currentLevel(state) {
  return LEVELS[state.roundIndex];
}

export function remainingCount(state) {
  return currentLevel(state).differences.length - state.found.size;
}

/** The ids the right panel applies for the current round. */
export function appliedDifferences(state) {
  return differenceIds(state.roundIndex);
}

export function startRound(state, roundIndex) {
  state.roundIndex = roundIndex;
  state.scoreAtRoundStart = state.score;
  state.found = new Set();
  state.foundAt = new Map();
  state.roundScore = 0;
  state.streak = 0;
  state.timeLeft = LEVELS[roundIndex].time;
  state.hintsLeft = HINTS_PER_ROUND;
  state.hint = null;
  state.wrongFlash = null;
  state.roundBreakdown = null;
  state.screen = 'play';
}

/** Start a whole new game from round 0. */
export function startGame(state) {
  state.score = 0;
  state.totalBreakdown = null;
  startRound(state, 0);
}

function panelOf(x, y) {
  // The panels are laid out in config.js: left at x 40, right at x 680, both
  // 560 wide starting at y 120. A tap outside both is not a game tap.
  if (y < 120 || y >= 680) return null;
  if (x >= 40 && x < 600) return { panel: 'left', px: x - 40, py: y - 120 };
  if (x >= 680 && x < 1240) return { panel: 'right', px: x - 680, py: y - 120 };
  return null;
}

/**
 * A tap at logical field coordinates. Returns an event flag and, for a find,
 * the difference found. A tap on a difference already found is ignored; a tap
 * on open picture is a wrong click (time and points off, red X shown).
 */
export function clickAt(state, x, y) {
  if (state.screen !== 'play') return EVENT_NONE;
  const hit = panelOf(x, y);
  if (!hit) return EVENT_NONE;
  const level = currentLevel(state);
  for (const diff of level.differences) {
    if (state.found.has(diff.id)) continue;
    const dx = hit.px - diff.x;
    const dy = hit.py - diff.y;
    if (dx * dx + dy * dy <= diff.r * diff.r) {
      state.found.add(diff.id);
      state.foundAt.set(diff.id, state.elapsed);
      state.streak += 1;
      const points = SCORE.find + (state.streak - 1) * SCORE.streakBonus;
      state.score += points;
      state.roundScore += points;
      if (state.hint && state.hint.id === diff.id) state.hint = null;
      if (state.found.size === level.differences.length) {
        const bonus = Math.ceil(state.timeLeft) * SCORE.timeBonusPerSecond;
        state.score += bonus;
        state.roundScore += bonus;
        state.roundBreakdown = {
          finds: state.roundScore - bonus,
          timeBonus: bonus,
          total: state.roundScore,
          timeLeft: Math.ceil(state.timeLeft),
        };
        state.screen = state.roundIndex + 1 >= LEVELS.length ? 'win' : 'clear';
        if (state.screen === 'win') {
          state.totalBreakdown = state.roundBreakdown;
        }
        return EVENT_FOUND | EVENT_ROUND_CLEAR;
      }
      return EVENT_FOUND;
    }
  }
  state.streak = 0;
  state.score = Math.max(0, state.score - SCORE.wrongPenalty);
  state.roundScore = Math.max(0, state.roundScore - SCORE.wrongPenalty);
  state.timeLeft = Math.max(0, state.timeLeft - WRONG_TIME_COST);
  state.wrongFlash = { x, y, until: state.elapsed + WRONG_FLASH_SECONDS };
  return EVENT_WRONG;
}

/** Spend a hint: ring the next unfound difference on both panels for a while. */
export function useHint(state) {
  if (state.screen !== 'play' || state.hintsLeft <= 0 || state.hint) return EVENT_NONE;
  const level = currentLevel(state);
  const next = level.differences.find((d) => !state.found.has(d.id));
  if (!next) return EVENT_NONE;
  state.hintsLeft -= 1;
  state.score = Math.max(0, state.score - SCORE.hintCost);
  state.roundScore = Math.max(0, state.roundScore - SCORE.hintCost);
  state.hint = { id: next.id, until: state.elapsed + HINT_SECONDS };
  return EVENT_HINT;
}

/** Advance the clock and expire the hint and wrong-click flashes. */
export function tick(state, dt) {
  state.elapsed += dt;
  if (state.screen !== 'play') return EVENT_NONE;
  state.timeLeft -= dt;
  if (state.hint && state.elapsed >= state.hint.until) state.hint = null;
  if (state.wrongFlash && state.elapsed >= state.wrongFlash.until) state.wrongFlash = null;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = 'over';
    return EVENT_TIME_UP;
  }
  return EVENT_NONE;
}

/** How far along a found marker's pop-in animation is, 0 to 1. */
export function markPop(state, id) {
  const at = state.foundAt.get(id);
  if (at === undefined) return 1;
  return Math.min(1, (state.elapsed - at) / MARK_POP_SECONDS);
}
