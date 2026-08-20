# End-to-end games

Two complete playthroughs, driven through the real UI — sticker, keypad, row
picker and all.

| Spec | What it plays |
|---|---|
| `regular-game.e2e.mts` | One roll per field, in score-card order. Part one lands on exactly 63, so the bonus boundary is pinned too. Final score **314**. |
| `yahtzee-game.e2e.mts` | Thirteen five-of-a-kinds, every one committed to the flush row. The first scores 50; the other twelve stack +100 each and sacrifice a row apiece — exactly the twelve non-flush fields. Final score **1250**. |

The yahtzee game is the one that exercises the flush-discard step, twelve times
over, ending with a single option left in the picker.

## Running them

```sh
pnpm test:e2e        # from the repo root or src/app-rooted
pnpm test:e2e:ui     # Playwright's UI mode, for stepping through a game
```

Playwright starts the dev server itself and reuses one you already have
running. On a fresh checkout you need the browser once:

```sh
npx playwright install chromium
```

If you would rather point at a Chromium you already have — a sandbox with a
pinned build, or a system install — set `PLAYWRIGHT_CHROMIUM_PATH` to its
executable and the config will use that instead.

## Adding to these

`game-page.mts` holds every selector in the suite, so a spec reads as a game
rather than as DOM poking:

```ts
const game = new GamePage(page)
await game.goto()
await game.enterRoll([1, 1, 1, 2, 3], 'aces')
expect((await game.row('aces')).score).toBe('3')
```

`enterRoll` takes an optional third argument, the row to sacrifice, which is
what a second or later flush needs.

The expected scores are worked out from `src/game/_logic/score/scoreCalculator.ts`
and are the specification here — if one disagrees with the app, check the
arithmetic before changing the app.
