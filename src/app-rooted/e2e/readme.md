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

Playwright's downloaded browsers are dynamically linked against paths that do not exist on
NixOS. They install without complaint and then die the moment they launch:

```
ProtocolError: Protocol error (Browser.getVersion): Internal server error, session closed.
```

Either of these fixes the test run:

```sh
# point at a chromium that actually runs here
export PLAYWRIGHT_CHROMIUM_PATH=$(which chromium)

# or hand Playwright a browser set built for NixOS
export PLAYWRIGHT_BROWSERS_PATH="$(nix build --no-link --print-out-paths nixpkgs#playwright-driver.browsers)"
export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
```

The second also fixes UI mode's own window, but the revision has to line up: Playwright 1.62.1
wants Chromium **r1234** (see `playwright-core/browsers.json`). If the nixpkgs
`playwright-driver` ships a different revision, the lookup fails instead. `PLAYWRIGHT_CHROMIUM_PATH`
has no such constraint but only covers the tests, not the UI-mode window — which is why
`test:e2e:ui` uses `--ui-port` rather than relying on it.

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
