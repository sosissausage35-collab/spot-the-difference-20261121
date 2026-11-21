// The lantern-festival scene, painted entirely with canvas shapes — no images,
// no fonts beyond the HUD's system font. `createLayout` fixes the seeded details
// (stars, petals, firework streaks) once per game; `drawScene` paints the whole
// 560x560 picture, applying the differences in `diffs` (a Set of ids) to the
// right-hand panel. The left panel is always drawn with an empty set.

import { createRandom, range, intRange } from './random.js';

export const PANEL_SIZE = 560;

/** The seven lanterns on the string, in order left to right. */
const LANTERNS = [
  { x: 60, y: 85 },
  { x: 130, y: 95 },
  { x: 200, y: 103 },
  { x: 280, y: 106 },
  { x: 360, y: 103 },
  { x: 430, y: 95 },
  { x: 500, y: 85 },
];

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

/** Fixed layout for one game: stars, petals and firework streaks from the seed. */
export function createLayout(seed) {
  const random = createRandom(seed);
  const stars = [];
  for (let i = 0; i < 80; i += 1) {
    stars.push({
      x: range(random, 8, 552),
      y: range(random, 8, 320),
      r: range(random, 0.8, 2.1),
      phase: range(random, 0, Math.PI * 2),
    });
  }
  const petals = [];
  for (let i = 0; i < 8; i += 1) {
    petals.push({
      x: range(random, 40, 520),
      y: range(random, 60, 420),
      size: range(random, 4, 7),
      phase: range(random, 0, Math.PI * 2),
      spin: range(random, 0.4, 0.9),
    });
  }
  const burst = (count) => {
    const angles = [];
    for (let i = 0; i < count; i += 1) angles.push((i / count) * Math.PI * 2 + range(random, -0.12, 0.12));
    return angles;
  };
  return {
    stars,
    petals,
    burstA: burst(14),
    burstB: burst(10),
    koiFlip: random() > 0.5,
  };
}

function drawSky(ctx, layout, diffs, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#160f3d');
  sky.addColorStop(0.5, '#2a1d5e');
  sky.addColorStop(0.85, '#4a2a72');
  sky.addColorStop(1, '#6b3a7d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_SIZE, 400);

  for (const star of layout.stars) {
    const twinkle = 0.55 + 0.45 * Math.sin(t * 1.4 + star.phase);
    ctx.fillStyle = `rgba(255, 244, 200, ${0.75 * twinkle})`;
    circle(ctx, star.x, star.y, star.r);
  }
  // The one bright star near the moon, with a little cross sparkle.
  if (!diffs.has('star-gone')) {
    ctx.fillStyle = '#fff3c4';
    circle(ctx, 400, 52, 2.6);
    ctx.strokeStyle = 'rgba(255, 243, 196, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(392, 52); ctx.lineTo(408, 52);
    ctx.moveTo(400, 44); ctx.lineTo(400, 60);
    ctx.stroke();
  }
  // The little three-star cluster, top left.
  ctx.fillStyle = '#ffe9a8';
  circle(ctx, 88, 78, 1.8);
  if (!diffs.has('cluster-star')) circle(ctx, 104, 66, 1.8);
  circle(ctx, 100, 92, 1.8);

  // The moon: a soft glow, then a crescent — or a full moon when that difference applies.
  const glow = ctx.createRadialGradient(468, 68, 10, 468, 68, 70);
  glow.addColorStop(0, 'rgba(255, 230, 160, 0.35)');
  glow.addColorStop(1, 'rgba(255, 230, 160, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(398, 0, 140, 138);
  ctx.fillStyle = '#ffe9a8';
  circle(ctx, 468, 68, 30);
  if (diffs.has('moon-full')) {
    ctx.fillStyle = 'rgba(210, 170, 90, 0.5)';
    circle(ctx, 458, 60, 4);
    circle(ctx, 476, 78, 3);
    circle(ctx, 470, 56, 2.5);
  } else {
    ctx.fillStyle = '#241a50';
    circle(ctx, 482, 58, 26);
  }
}

function drawFireworks(ctx, layout, diffs) {
  if (!diffs.has('firework-gone')) {
    for (const angle of layout.burstA) {
      const x2 = 150 + Math.cos(angle) * 34;
      const y2 = 118 + Math.sin(angle) * 34;
      ctx.strokeStyle = 'rgba(255, 150, 110, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(150 + Math.cos(angle) * 8, 118 + Math.sin(angle) * 8);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = '#ffd166';
      circle(ctx, x2, y2, 2);
    }
    ctx.fillStyle = '#ff8fa3';
    circle(ctx, 150, 118, 4);
  }
  for (const angle of layout.burstB) {
    const x2 = 420 + Math.cos(angle) * 24;
    const y2 = 88 + Math.sin(angle) * 24;
    ctx.strokeStyle = 'rgba(140, 220, 255, 0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(420 + Math.cos(angle) * 6, 88 + Math.sin(angle) * 6);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.fillStyle = '#cfeeff';
    circle(ctx, x2, y2, 1.6);
  }
  // The night bird, a small dark silhouette.
  if (!diffs.has('bird-gone')) {
    ctx.strokeStyle = '#120c2e';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(318, 150);
    ctx.quadraticCurveTo(325, 142, 331, 149);
    ctx.quadraticCurveTo(337, 142, 343, 149);
    ctx.stroke();
  }
}

function drawMountainsAndTown(ctx, diffs, t) {
  ctx.fillStyle = '#241a4d';
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.lineTo(70, 312);
  ctx.lineTo(150, 348);
  ctx.lineTo(240, 300);
  ctx.lineTo(330, 350);
  ctx.lineTo(420, 306);
  ctx.lineTo(500, 346);
  ctx.lineTo(560, 318);
  ctx.lineTo(560, 400);
  ctx.lineTo(0, 400);
  ctx.closePath();
  ctx.fill();

  // Rooftops: three houses in silhouette.
  ctx.fillStyle = '#1c1440';
  ctx.fillRect(30, 372, 120, 58);
  ctx.fillRect(200, 360, 78, 70);
  ctx.fillRect(290, 366, 72, 64);
  ctx.fillStyle = '#150e33';
  ctx.beginPath();
  ctx.moveTo(22, 372); ctx.lineTo(90, 338); ctx.lineTo(158, 372); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(194, 360); ctx.lineTo(239, 336); ctx.lineTo(284, 360); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(284, 366); ctx.lineTo(326, 340); ctx.lineTo(368, 366); ctx.closePath(); ctx.fill();
  // The middle house's window: warm and lit, or dark.
  ctx.fillStyle = diffs.has('window-dark') ? '#241d45' : '#ffd76a';
  ctx.fillRect(228, 370, 16, 20);
  ctx.fillStyle = '#241d45';
  ctx.fillRect(235, 370, 2, 20);
  ctx.fillRect(228, 379, 16, 2);
  // Chimney smoke, three soft puffs that drift with time.
  if (!diffs.has('smoke-gone')) {
    const puffs = [
      { x: 322 + Math.sin(t * 0.8) * 2, y: 312, r: 7, a: 0.5 },
      { x: 328 + Math.sin(t * 0.8 + 1) * 3, y: 298, r: 9, a: 0.35 },
      { x: 320 + Math.sin(t * 0.8 + 2) * 3, y: 284, r: 11, a: 0.22 },
    ];
    for (const puff of puffs) {
      ctx.fillStyle = `rgba(200, 190, 230, ${puff.a})`;
      circle(ctx, puff.x, puff.y, puff.r);
    }
  }
  ctx.fillStyle = '#1c1440';
  ctx.fillRect(316, 318, 12, 26);
}

function drawLanternString(ctx, diffs) {
  ctx.strokeStyle = '#0f0a28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 70);
  for (let x = 20; x <= 540; x += 10) {
    const y = 78 + 28 * Math.sin((Math.PI * (x - 20)) / 520);
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  LANTERNS.forEach((lantern, index) => {
    const dark = diffs.has('lantern-dark') && index === 1;
    const green = diffs.has('lantern-green') && index === 3;
    const blueGlow = diffs.has('glow-blue') && index === 6;
    if (!dark) {
      const glow = ctx.createRadialGradient(lantern.x, lantern.y + 4, 4, lantern.x, lantern.y + 4, 34);
      glow.addColorStop(0, blueGlow ? 'rgba(120, 180, 255, 0.4)' : 'rgba(255, 180, 80, 0.4)');
      glow.addColorStop(1, 'rgba(255, 180, 80, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(lantern.x - 34, lantern.y - 30, 68, 68);
    }
    ctx.fillStyle = dark ? '#3a3348' : green ? '#3fae6a' : '#e5484d';
    ellipse(ctx, lantern.x, lantern.y + 4, 13, 16);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(lantern.x - 6, lantern.y - 14, 12, 5);
    ctx.fillRect(lantern.x - 6, lantern.y + 17, 12, 4);
    ctx.strokeStyle = dark ? '#241d33' : '#a83438';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lantern.x - 12, lantern.y - 2);
    ctx.lineTo(lantern.x + 12, lantern.y - 2);
    ctx.moveTo(lantern.x - 12, lantern.y + 10);
    ctx.lineTo(lantern.x + 12, lantern.y + 10);
    ctx.stroke();
    if (!(diffs.has('tassel-gone') && index === 5)) {
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lantern.x, lantern.y + 21);
      ctx.lineTo(lantern.x, lantern.y + 30);
      ctx.stroke();
      ctx.fillStyle = '#e8b93c';
      circle(ctx, lantern.x, lantern.y + 32, 2.5);
    }
  });
}

function drawTree(ctx, diffs) {
  ctx.strokeStyle = '#4a2f22';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(478, 472);
  ctx.quadraticCurveTo(482, 420, 478, 372);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(478, 400);
  ctx.quadraticCurveTo(452, 372, 436, 348);
  ctx.moveTo(478, 392);
  ctx.quadraticCurveTo(505, 360, 520, 330);
  ctx.moveTo(478, 372);
  ctx.quadraticCurveTo(470, 330, 468, 300);
  ctx.stroke();
  const clusters = [
    { x: 450, y: 330, r: 26 },
    { x: 505, y: 310, r: 28 },
    { x: 470, y: 290, r: 24 },
    { x: 430, y: 360, r: 22 },
    { x: 520, y: 360, r: 22 },
    { x: 455, y: 425, r: 24 },
  ];
  clusters.forEach((cluster, index) => {
    if (diffs.has('blossom-gone') && index === 5) return;
    ctx.fillStyle = '#e78fb3';
    circle(ctx, cluster.x, cluster.y, cluster.r);
    ctx.fillStyle = '#f2a7c3';
    circle(ctx, cluster.x - 8, cluster.y - 6, cluster.r * 0.6);
    circle(ctx, cluster.x + 9, cluster.y + 4, cluster.r * 0.55);
    ctx.fillStyle = '#f7c6d9';
    circle(ctx, cluster.x + 2, cluster.y - 9, cluster.r * 0.4);
  });
}

function drawStall(ctx, diffs) {
  // The striped awning.
  for (let i = 0; i < 10; i += 1) {
    const x = 30 + i * 15;
    const teal = diffs.has('awning-stripe') && i === 7;
    ctx.fillStyle = teal ? '#2fa8a0' : i % 2 === 0 ? '#d94f4f' : '#f5e6c8';
    ctx.fillRect(x, 372, 15, 26);
  }
  ctx.fillStyle = '#8a2f2f';
  for (let i = 0; i < 10; i += 1) {
    const x = 30 + i * 15;
    ctx.beginPath();
    ctx.arc(x + 7.5, 398, 7.5, 0, Math.PI);
    ctx.fill();
  }
  // A petal resting on the awning.
  if (!diffs.has('petal-awning')) {
    ctx.fillStyle = '#f2a7c3';
    ellipse(ctx, 160, 382, 6, 3.5, 0.4);
  }
  // The stall body and counter.
  ctx.fillStyle = '#7a4a2b';
  ctx.fillRect(35, 398, 140, 82);
  ctx.fillStyle = '#5d3620';
  ctx.fillRect(35, 398, 140, 8);
  ctx.fillStyle = '#a86a3d';
  ctx.fillRect(35, 440, 140, 10);
  // The sign board with a little painted lantern.
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(83, 404, 44, 26);
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(83, 404, 44, 26);
  if (!diffs.has('sign-blank')) {
    ctx.fillStyle = '#e5484d';
    ellipse(ctx, 105, 415, 7, 9);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(101, 405, 8, 3);
    ctx.fillRect(101, 424, 8, 3);
  }
  // The steamer pot and its steam.
  ctx.fillStyle = '#c9a227';
  ellipse(ctx, 150, 428, 16, 8);
  ctx.fillStyle = '#8a6d2f';
  ellipse(ctx, 150, 424, 16, 5);
  if (!diffs.has('steam-gone')) {
    ctx.strokeStyle = 'rgba(240, 240, 255, 0.55)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i += 1) {
      const x = 140 + i * 10;
      ctx.beginPath();
      ctx.moveTo(x, 420);
      ctx.bezierCurveTo(x - 5, 405, x + 5, 392, x - 2, 378);
      ctx.bezierCurveTo(x - 6, 368, x + 2, 360, x, 352);
      ctx.stroke();
    }
  }
  // Paper cups on the counter.
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(52, 428, 10, 12);
  ctx.fillRect(66, 428, 10, 12);
}

function drawGroundAndCanal(ctx, layout, diffs, t) {
  ctx.fillStyle = '#2b1f45';
  ctx.fillRect(0, 420, PANEL_SIZE, 60);
  ctx.fillStyle = '#3a2c5c';
  for (let i = 0; i < 8; i += 1) {
    ellipse(ctx, 40 + i * 66, 452 + (i % 2) * 12, 22, 7);
  }
  // A little white flower on the bank.
  if (!diffs.has('flower-gone')) {
    ctx.strokeStyle = '#3f7a44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(500, 478);
    ctx.lineTo(500, 458);
    ctx.stroke();
    ctx.fillStyle = '#f5f0ff';
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      circle(ctx, 500 + Math.cos(a) * 5, 456 + Math.sin(a) * 5, 3);
    }
    ctx.fillStyle = '#f2c94c';
    circle(ctx, 500, 456, 3);
  }

  // The canal.
  const water = ctx.createLinearGradient(0, 480, 0, 560);
  water.addColorStop(0, '#16324f');
  water.addColorStop(1, '#0b1c33');
  ctx.fillStyle = water;
  ctx.fillRect(0, 480, PANEL_SIZE, 80);
  ctx.strokeStyle = 'rgba(150, 200, 255, 0.12)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i += 1) {
    const y = 492 + i * 14;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(550, y + ((i % 2) * 2 - 1));
    ctx.stroke();
  }
  // The moon's reflection, shimmering gold dashes.
  if (!diffs.has('reflection-gone')) {
    ctx.fillStyle = 'rgba(255, 220, 130, 0.5)';
    for (let i = 0; i < 6; i += 1) {
      const w = 26 - i * 3;
      const x = 468 - w / 2 + Math.sin(t * 1.2 + i) * 4;
      ctx.fillRect(x, 492 + i * 9, w, 3);
    }
  }
  // The koi.
  if (!diffs.has('koi-gone')) {
    const dir = layout.koiFlip ? -1 : 1;
    ctx.fillStyle = '#ff8c42';
    ellipse(ctx, 380, 525, 20, 7);
    ctx.beginPath();
    ctx.moveTo(380 + 20 * dir, 525);
    ctx.lineTo(380 + 32 * dir, 518);
    ctx.lineTo(380 + 32 * dir, 532);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3e0';
    ellipse(ctx, 372, 523, 7, 4);
    ctx.fillStyle = '#1c1440';
    circle(ctx, 364, 523, 1.6);
  }
  // The little boat with its lantern.
  if (!diffs.has('boat-gone')) {
    ctx.fillStyle = '#7a4a2b';
    ctx.beginPath();
    ctx.moveTo(82, 500);
    ctx.lineTo(158, 500);
    ctx.lineTo(146, 516);
    ctx.lineTo(94, 516);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5d3620';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 500);
    ctx.lineTo(120, 478);
    ctx.stroke();
    ctx.fillStyle = '#e5484d';
    ellipse(ctx, 120, 482, 7, 9);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(116, 472, 8, 3);
    if (!diffs.has('ripple-gone')) {
      ctx.strokeStyle = 'rgba(180, 220, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ellipse(ctx, 120, 528, 46, 6);
      ctx.stroke();
      ellipse(ctx, 120, 534, 60, 7);
      ctx.stroke();
    }
  }
}

function drawBridge(ctx, diffs) {
  // The arch deck.
  ctx.fillStyle = '#6b4226';
  ctx.beginPath();
  ctx.moveTo(200, 458);
  ctx.quadraticCurveTo(280, 424, 360, 458);
  ctx.lineTo(360, 470);
  ctx.quadraticCurveTo(280, 436, 200, 470);
  ctx.closePath();
  ctx.fill();
  // Rails and posts.
  ctx.strokeStyle = '#8a5a34';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(202, 452);
  ctx.quadraticCurveTo(280, 420, 358, 452);
  ctx.stroke();
  ctx.fillStyle = '#8a2f2f';
  ctx.fillRect(202, 430, 8, 40);
  ctx.fillRect(350, 430, 8, 40);
  ctx.fillStyle = '#c9a227';
  circle(ctx, 206, 428, 5);
  circle(ctx, 354, 428, 5);
  // The banner on the right post.
  if (!diffs.has('banner-gone')) {
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(338, 456, 20, 34);
    ctx.fillStyle = '#f2c94c';
    circle(ctx, 348, 468, 5);
    ctx.fillRect(344, 476, 8, 3);
  }
  // The cat, sitting on the deck.
  if (!diffs.has('cat-gone')) {
    ctx.fillStyle = '#2b2b3a';
    ellipse(ctx, 298, 440, 14, 11);
    circle(ctx, 306, 424, 9);
    ctx.beginPath();
    ctx.moveTo(300, 418); ctx.lineTo(302, 408); ctx.lineTo(306, 417); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(308, 417); ctx.lineTo(312, 408); ctx.lineTo(314, 418); ctx.closePath(); ctx.fill();
    const flip = diffs.has('tail-flip');
    ctx.strokeStyle = '#2b2b3a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(286, 446);
    if (flip) ctx.quadraticCurveTo(272, 446, 268, 432);
    else ctx.quadraticCurveTo(306, 452, 320, 434);
    ctx.stroke();
    ctx.fillStyle = '#f2c94c';
    circle(ctx, 303, 423, 1.6);
    circle(ctx, 309, 423, 1.6);
  }
}

function drawPetals(ctx, layout, t) {
  ctx.fillStyle = 'rgba(242, 167, 195, 0.85)';
  for (const petal of layout.petals) {
    const x = petal.x + Math.sin(t * petal.spin + petal.phase) * 14;
    const y = 40 + ((petal.y + t * 12) % 400);
    ellipse(ctx, x, y, petal.size, petal.size * 0.55, Math.sin(t + petal.phase) * 0.8);
  }
}

function drawVignette(ctx) {
  const vignette = ctx.createRadialGradient(280, 280, 200, 280, 280, 420);
  vignette.addColorStop(0, 'rgba(10, 6, 28, 0)');
  vignette.addColorStop(1, 'rgba(10, 6, 28, 0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, PANEL_SIZE, PANEL_SIZE);
}

/** Paint the whole 560x560 picture at the current origin, applying `diffs`. */
export function drawScene(ctx, layout, diffs, t) {
  drawSky(ctx, layout, diffs, t);
  drawFireworks(ctx, layout, diffs);
  drawMountainsAndTown(ctx, diffs, t);
  drawGroundAndCanal(ctx, layout, diffs, t);
  drawBridge(ctx, diffs);
  drawStall(ctx, diffs);
  drawTree(ctx, diffs);
  drawLanternString(ctx, diffs);
  drawPetals(ctx, layout, t);
  drawVignette(ctx);
}
