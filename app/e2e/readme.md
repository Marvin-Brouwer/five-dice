# End-to-end games

Two complete playthroughs, driven through the real UI — sticker, keypad, row
picker and all.

| Spec | What it plays |
|---|---|
| `regular-game.e2e.mts` | One roll per field, in score-card order. Part one lands on exactly 63, so the bonus boundary is pinned too. Final score **314**. |
| `flush-game.e2e.mts` | Thirteen five-of-a-kinds, every one committed to the flush row. The first scores 50; the other twelve stack +100 each and sacrifice a row apiece — exactly the twelve non-flush fields. Final score **1250**. |

The flush game is the one that exercises the flush-discard step, twelve times
over, ending with a single option left in the picker.

## Running them

```sh
pnpm test:e2e:install  # download the browser (once, per checkout)
pnpm test:e2e          # from the repo root or app/
pnpm test:e2e:ui       # UI mode, for stepping through a game
pnpm test:e2e:report   # reopen the last HTML report
```

Every run records a video of each game and a screenshot of the final board,
both attached to the HTML report — `pnpm test:e2e:report` to watch them back.
Traces are kept only for failures, since they run to roughly 20MB a game
against 1.7MB for the video and screenshot together.

The videos are silent, and cannot be otherwise: Playwright records by
screencast — a stream of JPEG frames — so there is no audio track to enable.
To actually *hear* the end-of-game fanfare, run headed
(`pnpm test:e2e -- --headed`). Playwright only passes Chromium `--mute-audio`
for headless runs, so a headed one is free to make noise, given an audio
device it can reach.

Both games assert the celebration instead of relying on anyone hearing it.
`celebration-spy.mts` counts animation frames and Web Audio playback from
before the page loads, so `expectCelebrated` can check that the confetti
actually animated and that the fanfare produced sound. A run without Git LFS
fails there with a message saying so, rather than leaving a decode error in
the console for someone to notice much later.

Each game also waits for the confetti to settle before finishing, which keeps
the recorded video from cutting off mid-celebration.

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
dependency of `@five-dice/app`, not of the workspace root, and
`pnpm exec` resolves binaries from the current package — so from the root you
get `Command "playwright" not found`, or, if you happen to have a global
install, a *different* Playwright version than the one this project pins. The
scripts forward through `--filter` and always hit the right one.

If you would rather point at a Chromium you already have — a sandbox with a
pinned build, or a system install — set `PLAYWRIGHT_CHROMIUM_PATH` to its
executable and the config will use that instead.

## When the browser will not start

`pnpm exec playwright install --list` prints the browsers Playwright can find,
per installation, and `--dry-run chromium` prints the exact location and
download URL it expects for this release. Neither downloads anything, and
between them they explain most "it cannot find the browser" situations.

**`PLAYWRIGHT_BROWSERS_PATH` redirects both the install and the lookup.** If
anything in your environment sets it globally, `pnpm test:e2e:install` writes
somewhere other than where you expect. Two traps follow from that:

- **`playwright install` writes into it.** It creates a `__dirlock` and a
  `.links/` directory there, so pointing it at a read-only path cannot work.
  The lock is acquired with 20 retries over ten minutes and prints nothing
  while it waits, so this can present as the command simply hanging.
- **`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` does not skip it.** That variable only
  suppresses the npm postinstall hook; an explicit `playwright install` still
  downloads.

**Browsers packaged by your OS or package manager usually will not be found.**
Playwright resolves browsers by revision number and by directory layout, and
both have to match the Playwright release exactly — 1.62.1 wants Chromium
**r1234** (`playwright-core/browsers.json`) laid out as
`chromium-1234/chrome-linux64/chrome` on linux-x64, because its "chromium" is a
*Chrome for Testing* build. Older releases shipped a plain Chromium under
`chrome-linux/chrome`. Either mismatch reports as `Executable doesn't exist at
…`, which reads like a missing install rather than a mismatch, so a version
bump alone will not fix it.

Some distributions also ship no `chromium-headless-shell`, which Playwright
would otherwise pick for a headless run. The config sets `channel: 'chromium'`
so the full browser is used in either mode, which covers that — at the cost of
a slightly heavier headless start everywhere.

Failing all of it, set `PLAYWRIGHT_CHROMIUM_PATH` to a Chromium you already
have and the config uses it directly, skipping browser resolution for the test
run. It does not cover UI mode's own window, which is why `test:e2e:ui` uses
`--ui-port`.

Unrelated but adjacent: this repo keeps `*.jpg *.wav *.mp3` in Git LFS.
Without `git-lfs` configured, those files check out as ~130-byte pointer stubs
and the app logs `EncodingError: Unable to decode audio data` on every run,
with the end-of-game fanfare silently never playing.

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

The expected scores are worked out from `src/game/logic/score/scoreCalculator.ts`
and are the specification here — if one disagrees with the app, check the
arithmetic before changing the app.
