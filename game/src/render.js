// Drawing only: the world's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred. The two panels
// are the same lantern-festival scene painted twice — the left one untouched,
// the right one with the round's differences applied — with gold rings on every
// difference found and a counter of how many are left.

import { BUTTONS, FIELD, FONT, PALETTE, PANEL } from './config.js';
import { LEVELS } from './levels.js';
import { appliedDifferences, currentLevel, markPop, remainingCount } from './world.js';
import { drawScene } from './scene.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const CARD = { width: 660, line: 32 };

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align = 'left', bold = false) {
    const key = `${size}:${bold ? 1 : 0}`;
    if (!fonts.has(key)) fonts.set(key, `${bold ? '700 ' : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  /** Map a client (mouse) point to logical field coordinates. */
  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const deviceX = (clientX - rect.left) * (canvas.width / rect.width);
    const deviceY = (clientY - rect.top) * (canvas.height / rect.height);
    return { x: (deviceX - view.x) / view.scale, y: (deviceY - view.y) / view.scale };
  }

  function drawHeader(state, best) {
    context.fillStyle = PALETTE.header;
    context.fillRect(0, 0, FIELD.width, 100);
    context.fillStyle = PALETTE.panelFrameDark;
    context.fillRect(0, 100, FIELD.width, 2);
    text('LANTERN NIGHT', 24, 46, 30, PALETTE.gold, 'left', true);
    text('Spot the difference at the lantern festival', 24, 74, 15, PALETTE.muted);
    const level = currentLevel(state);
    context.fillStyle = PALETTE.card;
    roundRect(context, 470, 26, 300, 40, 20);
    context.fill();
    context.strokeStyle = PALETTE.cardEdge;
    context.lineWidth = 1.5;
    context.stroke();
    text(`Round ${state.roundIndex + 1} of 3 · ${level.name}`, 620, 52, 17, PALETTE.text, 'center', true);
    const low = state.timeLeft <= 10 && state.screen === 'play';
    text(formatTime(state.timeLeft), 830, 50, 36, low ? PALETTE.timerLow : PALETTE.text, 'center', true);
    text('time', 830, 74, 12, PALETTE.muted, 'center');
    const left = remainingCount(state);
    context.fillStyle = left === 0 ? '#2f7a4d' : '#7a2f2f';
    roundRect(context, 900, 26, 150, 40, 20);
    context.fill();
    text(left === 0 ? 'All found!' : `${left} left to find`, 975, 52, 17, '#ffffff', 'center', true);
    text(`Score ${state.score.toLocaleString('en-US')}`, 1256, 46, 24, PALETTE.text, 'right', true);
    text(`Best ${best.toLocaleString('en-US')}`, 1256, 72, 14, PALETTE.muted, 'right');
  }

  function drawFooter(state) {
    text('Click a difference · Arrow keys + Enter to pick · H hint · P pause · M mute', 24, 706, 14, PALETTE.footerText);
    const hint = BUTTONS.hint;
    context.fillStyle = state.hintsLeft > 0 ? PALETTE.button : '#241d45';
    roundRect(context, hint.x, hint.y, hint.w, hint.h, 8);
    context.fill();
    context.strokeStyle = PALETTE.buttonEdge;
    context.lineWidth = 1.5;
    context.stroke();
    text(`Hint (H) · ${state.hintsLeft}`, hint.x + hint.w / 2, hint.y + 19, 14, state.hintsLeft > 0 ? PALETTE.text : PALETTE.muted, 'center', true);
    const pause = BUTTONS.pause;
    context.fillStyle = PALETTE.button;
    roundRect(context, pause.x, pause.y, pause.w, pause.h, 8);
    context.fill();
    context.strokeStyle = PALETTE.buttonEdge;
    context.stroke();
    text('Pause', pause.x + pause.w / 2, pause.y + 19, 14, PALETTE.text, 'center', true);
  }

  function drawPanel(state, layout, diffs, panelX, label, t) {
    context.save();
    context.beginPath();
    roundRect(context, panelX, PANEL.y, PANEL.size, PANEL.size, 10);
    context.clip();
    context.translate(panelX, PANEL.y);
    drawScene(context, layout, diffs, t);
    context.restore();
    context.strokeStyle = PALETTE.panelFrame;
    context.lineWidth = 3;
    roundRect(context, panelX, PANEL.y, PANEL.size, PANEL.size, 10);
    context.stroke();
    context.fillStyle = 'rgba(20, 16, 46, 0.85)';
    roundRect(context, panelX + 12, PANEL.y + 12, 34, 30, 8);
    context.fill();
    text(label, panelX + 29, PANEL.y + 34, 17, PALETTE.gold, 'center', true);
  }

  function ring(x, y, radius, color, width, dashed) {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.setLineDash(dashed ? [9, 7] : []);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  }

  function drawMarkers(state, t) {
    const level = currentLevel(state);
    for (const diff of level.differences) {
      if (!state.found.has(diff.id)) continue;
      const pop = markPop(state, diff.id);
      const scale = 0.6 + 0.4 * pop;
      const alpha = pop;
      context.globalAlpha = alpha;
      for (const panelX of [PANEL.leftX, PANEL.rightX]) {
        const x = panelX + diff.x;
        const y = PANEL.y + diff.y;
        ring(x, y, (diff.r + 6) * scale, PALETTE.gold, 3.5, false);
        ring(x, y, (diff.r + 1) * scale, '#fff3c4', 1.5, false);
      }
      context.globalAlpha = 1;
    }
    if (state.hint) {
      const diff = level.differences.find((d) => d.id === state.hint.id);
      if (diff) {
        const pulse = 3 * Math.sin(t * 6);
        for (const panelX of [PANEL.leftX, PANEL.rightX]) {
          ring(panelX + diff.x, PANEL.y + diff.y, diff.r + 12 + pulse, PALETTE.gold, 3, true);
        }
      }
    }
    if (state.wrongFlash) {
      const remain = state.wrongFlash.until - state.elapsed;
      context.globalAlpha = Math.max(0, Math.min(1, remain / 0.7));
      context.strokeStyle = PALETTE.red;
      context.lineWidth = 4;
      const x = state.wrongFlash.x;
      const y = state.wrongFlash.y;
      context.beginPath();
      context.moveTo(x - 12, y - 12); context.lineTo(x + 12, y + 12);
      context.moveTo(x + 12, y - 12); context.lineTo(x - 12, y + 12);
      context.stroke();
      context.globalAlpha = 1;
    }
  }

  function drawPointer(state) {
    if (state.screen !== 'play') return;
    if (state.crosshair.keyboard) {
      const { x, y } = state.crosshair;
      context.strokeStyle = PALETTE.gold;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(x, y, 12, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(x - 18, y); context.lineTo(x - 6, y);
      context.moveTo(x + 6, y); context.lineTo(x + 18, y);
      context.moveTo(x, y - 18); context.lineTo(x, y - 6);
      context.moveTo(x, y + 6); context.lineTo(x, y + 18);
      context.stroke();
      return;
    }
    if (state.mouse.inside) {
      context.strokeStyle = 'rgba(245, 237, 216, 0.5)';
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(state.mouse.x, state.mouse.y, 13, 0, Math.PI * 2);
      context.stroke();
    }
  }

  function drawCard(title, lines, prompt, accent) {
    const height = 120 + lines.length * CARD.line + 64;
    const x = (FIELD.width - CARD.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(10, 6, 28, 0.55)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.card;
    roundRect(context, x, y, CARD.width, height, 16);
    context.fill();
    context.strokeStyle = PALETTE.cardEdge;
    context.lineWidth = 2;
    context.stroke();
    text(title, FIELD.width / 2, y + 66, 44, accent || PALETTE.gold, 'center', true);
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + 118 + i * CARD.line, 19, PALETTE.text, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 34, 21, PALETTE.gold, 'center', true);
  }

  function drawTitle(state, best) {
    drawCard(
      'LANTERN NIGHT',
      [
        'Two pictures hang side by side. The right one hides 8 changes.',
        'Find them all before the lanterns burn down.',
        'Click a difference — or steer with the arrow keys and press Enter.',
        'H spends a hint · P pauses · M mutes',
        `Best total score: ${best.toLocaleString('en-US')}`,
      ],
      'Press Space or click to start',
    );
  }

  /** Paint one frame: header, both panels, markers, footer, then any overlay card. */
  function draw(state, screen, best, layout, t) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawHeader(state, best);
    drawPanel(state, layout, new Set(), PANEL.leftX, 'A', t);
    drawPanel(state, layout, appliedDifferences(state), PANEL.rightX, 'B', t);
    drawMarkers(state, t);
    drawFooter(state);
    drawPointer(state);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) {
      drawCard('Paused', ['The lanterns wait for you.'], 'Press P to resume');
    } else if (screen === SCREEN_CLEAR) {
      const b = state.roundBreakdown;
      drawCard(
        'Round Clear!',
        [
          `${LEVELS[state.roundIndex].name} — all ${LEVELS[state.roundIndex].differences.length} differences found`,
          `Finds ${b.finds.toLocaleString('en-US')} · Time bonus +${b.timeBonus.toLocaleString('en-US')} (${b.timeLeft}s left)`,
          `Round score ${b.total.toLocaleString('en-US')} · Total ${state.score.toLocaleString('en-US')}`,
        ],
        'Press Space for the next round',
      );
    } else if (screen === SCREEN_OVER) {
      drawCard(
        "Time's Up",
        [
          `The lanterns burned down with ${remainingCount(state)} difference${remainingCount(state) === 1 ? '' : 's'} still hiding.`,
          `Score ${state.score.toLocaleString('en-US')}`,
        ],
        'Press Space to try this round again',
      );
    } else if (screen === SCREEN_WIN) {
      const b = state.totalBreakdown;
      drawCard(
        'Festival Complete!',
        [
          'You found every difference in all three rounds.',
          `Final round score ${b.total.toLocaleString('en-US')} · Total ${state.score.toLocaleString('en-US')}`,
          `Best total score: ${best.toLocaleString('en-US')}`,
        ],
        'Press Space to play again',
        '#7ddb8a',
      );
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toLogical };
}
