# emberdrift

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/aboylabs/emberdrift/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/aboylabs/emberdrift/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Emberdrift is an original arcade game built for make.fun's "Make the best game" bounty: guide a lone ember through drifting winds, gather sparks, dodge the cold, and keep the flame alive as long as you can. It is a complete game — a goal, rules, keyboard and mouse controls, score, lives, a start screen, a game-over screen with restart, and a live HUD — running entirely from static files in `game/`, with no network request.

## Run it

```sh
npx serve game
```

Then open http://localhost:3000 in a desktop browser (Chrome works best). Any static file server works — the game is plain HTML, CSS and JavaScript under `game/`, with no build step.

## How it is entered

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` into the output directory and writes `output/dossier.json` with the kit's vendored `buildDossier` from `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
