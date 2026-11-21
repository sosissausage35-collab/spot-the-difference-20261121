// Lantern Night — every tuning number, colour and layout rect in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** One picture panel: a 560x560 square. Left holds the original, right the changed scene. */
export const PANEL = { size: 560, leftX: 40, rightX: 680, y: 120 };

export const HEADER = { height: 100 };
export const FOOTER = { y: 684, height: 28 };

/** Clickable buttons drawn in the footer bar (logical coordinates). */
export const BUTTONS = {
  hint: { x: 1042, y: 686, w: 118, h: 28 },
  pause: { x: 1172, y: 686, w: 68, h: 28 },
};

/** The three rounds: name, seconds on the clock, and how many differences hide in each. */
export const ROUNDS = [
  { name: 'Lantern Eve', time: 90 },
  { name: 'Festival Lights', time: 75 },
  { name: 'Midnight Hunt', time: 60 },
];

export const DIFFERENCES_PER_ROUND = 8;
export const HINTS_PER_ROUND = 3;
export const HINT_SECONDS = 3;
/** Seconds a wrong click costs, and how long its red X stays on screen. */
export const WRONG_TIME_COST = 3;
export const WRONG_FLASH_SECONDS = 0.7;
/** How long a found marker takes to pop in. */
export const MARK_POP_SECONDS = 0.35;

export const SCORE = {
  find: 100,
  streakBonus: 25,
  hintCost: 25,
  wrongPenalty: 10,
  timeBonusPerSecond: 5,
};

/** Keyboard crosshair speed, logical pixels per second. */
export const CROSSHAIR_SPEED = 520;

export const PALETTE = {
  backdrop: '#14102e',
  header: '#1d1745',
  panelFrame: '#c9a227',
  panelFrameDark: '#7a5f14',
  text: '#f5edd8',
  muted: '#a89ec7',
  gold: '#f2c94c',
  red: '#e5534b',
  timerLow: '#ff6b5e',
  card: '#241d4d',
  cardEdge: '#4a3f8f',
  footerText: '#8f86b8',
  button: '#2e2560',
  buttonEdge: '#6b5bb5',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best total score is kept between visits (this browser only). */
export const BEST_KEY = 'lantern-night.best';
