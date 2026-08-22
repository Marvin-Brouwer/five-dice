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
pnpm test:e2e          # from the repo root or src/app-rooted
pnpm test:e2e:ui       # UI mode, for stepping through a game
pnpm test:e2e:report    # reopen the last HTML report
```

`test:e2e:ui` passes `--ui-port=0`, so Playwright serves the UI and opens it in your normal
browser instead of launching a second Chromium of its own. That is a plain improvement
everywhere, and it is the only thing that works on systems where the bundled browser cannot
run — see below.

Playwright starts the dev server itself and reuses one you already have
running. On a fresh checkout you need the browser once:

```sh
npx playwright install chromium
```

If you would rather point at a Chromium you already have — a sandbox with a
pinned build, or a system install — set `PLAYWRIGHT_CHROMIUM_PATH` to its
executable and the config will use that instead.

## NixOS

Set `PLAYWRIGHT_BROWSERS_PATH` to the nixpkgs browser bundle and it works:

```sh
export PLAYWRIGHT_BROWSERS_PATH="$(nix build --no-link --print-out-paths nixpkgs#playwright-driver.browsers)"
```

Two gotchas that make this fail in ways the error messages do not explain:

**The revision has to match.** Playwright resolves browsers by revision number, so
`playwright-driver` has to be from the same Playwright release. 1.62.1 wants Chromium **r1234**
(`playwright-core/browsers.json`). A mismatch shows up as `Executable doesn't exist at
.../chromium-<revision>/...` rather than as a version complaint.

**nixpkgs ships no `chromium-headless-shell`.** Playwright normally uses that separate, smaller
binary for headless runs, so with the nix bundle you would get:

```
Executable doesn't exist at .../chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
```

even though the revision is right and Chromium is sitting there next to it. The config sets
`channel: 'chromium'`, which makes Playwright use the full browser for headless runs too, so
this is already handled — worth knowing if you ever see that error in another project.

If the bundle is awkward to line up, `PLAYWRIGHT_CHROMIUM_PATH=$(which chromium)` sidesteps
browser resolution entirely for the test run. It does not cover UI mode's own window, which is
why `test:e2e:ui` uses `--ui-port`.

Unrelated but adjacent: this repo keeps `*.jpg *.wav *.mp3` in Git LFS. Without `git-lfs`
configured, those files check out as ~130-byte pointer stubs and the app logs
`EncodingError: Unable to decode audio data` on every run, with the end-of-game fanfare silently
never playing. The tests pass either way, since audio failure is caught and warned.

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
