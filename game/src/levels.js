// The three rounds and the differences hidden in each. Every difference is one
// small change the scene painter makes to the right-hand panel: an `id` the scene
// knows, a human name for the round-clear recap, its centre in panel coordinates
// (the panel is 560x560) and the radius a tap must land inside. The left panel
// always shows the scene with no difference applied; the right panel applies all
// of its round's differences at once.

export const LEVELS = [
  {
    name: 'Lantern Eve',
    time: 90,
    blurb: 'Warm-up: big, friendly changes.',
    differences: [
      { id: 'moon-full', name: 'The moon turned full', x: 468, y: 68, r: 32 },
      { id: 'cat-gone', name: 'The bridge cat slipped away', x: 300, y: 438, r: 28 },
      { id: 'lantern-green', name: 'A lantern turned green', x: 280, y: 106, r: 26 },
      { id: 'boat-gone', name: 'The little boat is gone', x: 120, y: 505, r: 32 },
      { id: 'firework-gone', name: 'A firework never went off', x: 150, y: 118, r: 32 },
      { id: 'sign-blank', name: 'The stall sign lost its mark', x: 105, y: 417, r: 24 },
      { id: 'blossom-gone', name: 'A blossom cluster fell', x: 455, y: 425, r: 28 },
      { id: 'star-gone', name: 'A bright star went out', x: 400, y: 52, r: 16 },
    ],
  },
  {
    name: 'Festival Lights',
    time: 75,
    blurb: 'Look closer: the small things start to move.',
    differences: [
      { id: 'koi-gone', name: 'The koi swam away', x: 380, y: 525, r: 26 },
      { id: 'lantern-dark', name: 'A lantern went dark', x: 130, y: 95, r: 24 },
      { id: 'steam-gone', name: 'The stall steam vanished', x: 148, y: 386, r: 26 },
      { id: 'banner-gone', name: 'A bridge banner is missing', x: 348, y: 473, r: 24 },
      { id: 'window-dark', name: 'A window went dark', x: 236, y: 380, r: 20 },
      { id: 'reflection-gone', name: 'The moon lost its reflection', x: 468, y: 520, r: 24 },
      { id: 'bird-gone', name: 'The night bird flew off', x: 330, y: 148, r: 22 },
      { id: 'tassel-gone', name: 'A lantern lost its tassel', x: 430, y: 125, r: 18 },
    ],
  },
  {
    name: 'Midnight Hunt',
    time: 60,
    blurb: 'The last round hides its changes in plain sight.',
    differences: [
      { id: 'tail-flip', name: "The cat's tail points the other way", x: 318, y: 432, r: 20 },
      { id: 'awning-stripe', name: 'An awning stripe changed colour', x: 142, y: 388, r: 16 },
      { id: 'ripple-gone', name: 'The boat ripples smoothed out', x: 120, y: 530, r: 22 },
      { id: 'cluster-star', name: 'A star left its little cluster', x: 104, y: 66, r: 20 },
      { id: 'glow-blue', name: "A lantern's glow turned cold", x: 500, y: 89, r: 24 },
      { id: 'smoke-gone', name: 'The chimney smoke cleared', x: 322, y: 300, r: 22 },
      { id: 'flower-gone', name: 'A bank flower is gone', x: 500, y: 462, r: 16 },
      { id: 'petal-awning', name: 'A petal fell off the awning', x: 160, y: 382, r: 16 },
    ],
  },
];

/** The differences of a round, as a set of ids the scene painter applies. */
export function differenceIds(roundIndex) {
  return new Set(LEVELS[roundIndex].differences.map((d) => d.id));
}
