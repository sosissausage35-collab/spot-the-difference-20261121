// The screenshot scenes behind ?shot=start|play|hint|end. Each one sets the
// world to a fixed, deterministic state — the same seed always gives the same
// frame — so the screenshots are real renders of the game's own code, showing
// the game at its best: the title over the festival scene, a round in progress
// with three differences found and five still hiding, a hint ringing an unfound
// difference, and a round cleared.

import { LEVELS } from './levels.js';
import { startRound } from './world.js';

/** The fixed clock reading the shot scenes render at, so petals and stars hold still. */
export const SHOT_TIME = 2.0;

/** Set `world` to the named scene and return the screen to draw over it. */
export function stageShot(name, world) {
  if (name === 'play') {
    startRound(world, 0);
    world.elapsed = 10;
    world.timeLeft = 62;
    world.score = 325;
    world.roundScore = 325;
    world.streak = 3;
    for (const id of ['moon-full', 'cat-gone', 'lantern-green']) {
      world.found.add(id);
      world.foundAt.set(id, 9);
    }
    return 'play';
  }
  if (name === 'hint') {
    startRound(world, 1);
    world.elapsed = 10;
    world.timeLeft = 48;
    world.score = 225;
    world.roundScore = 225;
    world.streak = 2;
    for (const id of ['koi-gone', 'lantern-dark']) {
      world.found.add(id);
      world.foundAt.set(id, 9);
    }
    world.hintsLeft = 2;
    world.hint = { id: 'steam-gone', until: 13 };
    return 'play';
  }
  if (name === 'end') {
    startRound(world, 0);
    world.elapsed = 10;
    world.timeLeft = 28;
    world.score = 940;
    world.roundScore = 940;
    for (const diff of LEVELS[0].differences) {
      world.found.add(diff.id);
      world.foundAt.set(diff.id, 9);
    }
    world.roundBreakdown = { finds: 800, timeBonus: 140, total: 940, timeLeft: 28 };
    world.screen = 'clear';
    return 'clear';
  }
  world.screen = 'title';
  return 'title';
}
