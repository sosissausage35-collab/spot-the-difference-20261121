# Lantern Night — Spot the Difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/sosissausage35-collab/spot-the-difference-20261121/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/sosissausage35-collab/spot-the-difference-20261121/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

An entry for the [best-spot-the-difference-game-20261121-0451 bounty](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451): a complete, original spot-the-difference game set at a lantern festival, painted entirely with canvas shapes — no images, no network, no build step.

## The game

Two pictures of the same lantern festival hang side by side. The right one hides **8 changes**. Find them all before the lanterns burn down.

- **3 rounds** — Lantern Eve (90s), Festival Lights (75s), Midnight Hunt (60s) — each with 8 fresh differences, from a moon that turned full to a cat's tail pointing the other way
- **A rich original scene** — paper lanterns on a string, a food stall with a striped awning, a cherry-blossom tree, a bridge cat, a canal with a koi and a little boat, fireworks, a night bird, drifting petals
- **Feel** — gold rings pop onto every difference found on both panels, a two-note chime, a streak bonus, a pulsing hint ring, a red X and lost seconds on a wrong click, a ticking clock under 10 seconds
- **Score, timer, hints** — 100 points a find plus a streak bonus, 3 hints a round, a time bonus for clearing fast, best score kept in the browser
- **Keyboard and mouse** — click a difference, or steer the crosshair with the arrow keys and press Enter; H spends a hint, P pauses, M mutes
- **Sounds** — every sound is synthesized with WebAudio; there are no audio files

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

`game/` is plain static files: `game/index.html` opens in desktop Chrome and plays with no network request.

## How it is built

- `game/src/config.js` — every tuning number, colour and layout rect
- `game/src/scene.js` — the lantern-festival scene, painted twice (original and changed)
- `game/src/levels.js` — the three rounds and their 24 differences
- `game/src/world.js` — the rules: rounds, clock, scoring, hints, wrong clicks
- `game/src/render.js` — header, panels, markers, cards
- `game/src/input.js` — keyboard crosshair and pointer taps
- `game/src/sound.js` — WebAudio chimes, thuds and fanfares
- `game/src/shots.js` — the deterministic scenes behind the screenshots
- `game/src/main.js` — boot and the one loop
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`

Screenshots live in `screenshots/` (see `shots.json` for the scenes behind them). Built with [make.fun](https://make.fun/r/f4pc3mbd) — if you enter a bounty there, the referral code is `f4pc3mbd`.

## License

MIT — see [LICENSE](LICENSE).
