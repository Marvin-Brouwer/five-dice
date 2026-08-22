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
pnpm test:e2e:install  # download the browser (once, per checkout)
pnpm test:e2e          # from the repo root or src/app-rooted
pnpm test:e2e:ui       # UI mode, for stepping through a game
pnpm test:e2e:report   # reopen the last HTML report
```

`test:e2e:ui` passes `--ui-port=0`, so Playwright serves the UI and opens it in your normal
browser instead of launching a second Chromium of its own. That is a plain improvement
everywhere, and it is the only thing that works on systems where the bundled browser cannot
run — see below.

Playwright starts the dev server itself and reuses one you already have
running. On a fresh checkout you need the browser once:

```sh
pnpm test:e2e:install
```

That downloads the exact Chromium build this Playwright release expects, so
version matching is never something you have to think about.

Reach for these scripts rather than `pnpm exec playwright …`. Playwright is a
dependency of `@five-dice/app-rooted`, not of the workspace root, and
`pnpm exec` resolves binaries from the current package — so from the root you
get `Command "playwright" not found`, or, if you happen to have a global
install, a *different* Playwright version than the one this project pins. The
scripts forward through `--filter` and always hit the right one.

If you would rather point at a Chromium you already have — a sandbox with a
pinned build, or a system install — set `PLAYWRIGHT_CHROMIUM_PATH` to its
executable and the config will use that instead.

## NixOS

Start with the normal route above — `pnpm test:e2e:install` — and make sure
**`PLAYWRIGHT_BROWSERS_PATH` is unset** while you do. Anything that sets it
globally, a system profile included, sends both the install and the lookup to
that directory instead. The downloaded browsers need to be runnable, which on
NixOS means `programs.nix-ld.enable` or an FHS environment; without one they
install cleanly and then die the moment they launch:

```
ProtocolError: Protocol error (Browser.getVersion): Internal server error, session closed.
```

If you would rather use the browsers from nixpkgs, two things make that fail
in ways the error messages do not explain. Both report as
`Executable doesn't exist at …`, which reads like a missing install rather
than a mismatch:

- **The revision has to match.** Playwright resolves browsers by revision
  number, so `playwright-driver` has to come from the same Playwright release.
  1.62.1 wants Chromium **r1234** (`playwright-core/browsers.json`).
- **So does the directory layout.** 1.62.1 expects
  `chromium-1234/chrome-linux64/chrome` on linux-x64. Older Playwright
  releases used `chrome-linux/chrome`, and a `playwright-driver` built for one
  of those will not be found even if the revision happens to line up.

nixpkgs also ships no `chromium-headless-shell`, which Playwright would
otherwise pick for a headless run. The config sets `channel: 'chromium'` so
the full browser is used in either mode, which covers that — at the cost of a
slightly heavier headless start everywhere.

Failing all of it, `PLAYWRIGHT_CHROMIUM_PATH=$(which chromium)` skips browser
resolution altogether for the test run. It does not cover UI mode's own
window, which is why `test:e2e:ui` uses `--ui-port`.

Unrelated but adjacent: this repo keeps `*.jpg *.wav *.mp3` in Git LFS.
Without `git-lfs` configured, those files check out as ~130-byte pointer stubs
and the app logs `EncodingError: Unable to decode audio data` on every run,
with the end-of-game fanfare silently never playing. The tests pass either
way, since audio failure is caught and warned.

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
