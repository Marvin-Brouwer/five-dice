# The loading splash

Tapping the icon of the installed app puts the launcher's startup image on
screen — the app icon on the manifest's `background_color` — and then hands over
to the page. Until this, the page it handed over to was blank, and stayed blank
for as long as the module graph took to fetch and parse, the dictionary took to
resolve, and the route's own chunk took to arrive. The icon appeared, the icon
went, and a moment later the app turned up. That is issue #98.

The splash is the same icon, drawn in `index.html`, tossing, until there is a
page to hand over to.

## Why it is markup and not a component

`component()` injects a component's stylesheet as a `<link>` it appends at
module load. That sheet is a fetch of its own, so it always lands after the
first paint — which is why the first-paint guards from issue #97 live in
`app/index.global.css` rather than in the stylesheets of the components they
are guarding. A component cannot exist at all during the stretch the splash is
covering: the whole point is the time before any module has run.

So the markup is in `app/index.html` and its rules are in
`app/index.global.css`, beside those guards. `index.html` links that sheet, and
a render-blocking `<link>` in `<head>` is by definition there for the first
paint, so there is no frame in which the splash is unstyled. Nothing is inlined
into a `<style>`: it would save no round trip the page is not already making,
and doing it *usefully* would mean copying the palette — `--color-page`,
`--background-page`, and their dark-theme overrides — into a second place to go
stale.

The critical-path budget went somewhere it buys something instead. The Google
Fonts sheet used to be a render-blocking cross-origin `<link>`, so nothing
painted at all — splash included — until `fonts.googleapis.com` answered. It is
now fetched with `media="print"` and handed to the screen on load, with a
`<noscript>` copy for the case that cannot. The faces already carry
`display=swap`, so text that beats them renders in the fallback and swaps,
which is what a slow sheet did anyway.

## Why it is beside `#app` and not inside it

`application()` mounts by calling `appRoot.replaceWith(appComponent)` — it
*replaces* `#app`. A splash inside it would be thrown away the moment the
bundle evaluated, which is the beginning of the wait rather than the end of it.
It is a sibling, and `position: fixed` over the shell that mounts underneath.

## Why it waits for `<main>` rather than for the router

The obvious signal is the router's own `on: { navigate }` handler, with
`navigationType === 'end'`. It is the wrong one, and quietly so.

The router is mounted with `viewTransition: true`. It hands the render to
`document.startViewTransition` and does not wait for it, then announces `end`
from a `finally` — so `end` arrives while `<main>` is still empty. Landing on
`/` makes that worse rather than exposing it: CultureSelect answers a
remembered locale by redirecting from its own mount, so the first route renders
nothing at all and the page the player asked for is a second navigation and
another chunk away. Measured on the dev server, dismissing on the first `end`
took the splash down about 150ms before anything was drawn — a blank cardboard
page, which is the exact thing the splash exists to prevent.

Counting navigations instead of taking the first `end` does not help either,
for the same reason: the redirect has not started yet when the first `end`
fires.

So `_shared/services/splash.mts` asks the only question that actually matters —
is there anything on the page yet? — with a `MutationObserver` on `<main>`. The
router's host element appears there straight away and a route may render
nothing into it, so the presence of elements says nothing; words or a drawing
is the test, and every page in this app opens with one or the other.

`app/e2e/splash.e2e.mts` guards the beat rather than the end state, because the
end state is identical either way. `app/e2e/splash-spy.mts` records what
`<main>` held at the instant the splash was told to go; a premature hand-over
shows up as an empty string.

## Reduced motion

The toss is switched off under `prefers-reduced-motion: reduce`, the way
`masthead.css` switches off its `settle`. The cross-fade stays — it is not the
kind of motion that asks about, and it is what makes `transitionend` fire, so
the element still leaves the document. A timer twice the fade's length removes
it regardless, for the cases the event does not come: a background tab throttles
the transition.

## No script, no splash

Nothing takes the splash down without JavaScript, and a die tossing over a page
that is never going to load is worse than the bare page. A `<noscript>` block in
`<head>` hides it.

Its rule is `html #splash`, not `#splash`. The build folds `index.global.css`
into a bundle it links *after* that block, so at equal specificity the sheet's
own `display: grid` would win and the splash would be there for good — measured
against `pnpm preview`, not guessed at. The e2e suite runs against the dev
server, where the sheets are still linked in source order, so it cannot see
this; the qualifier is the thing to leave alone.

## The launch colour

`webManifest.background_color` in `app/vite.config.mts` was `#B3AEA1` against a
`--color-page` of `#b8b2a6`: close enough to have been meant as the same colour,
far enough apart to read as a flash when the launcher handed over. It is now the
token's value.

A manifest is a static file. It cannot read a custom property and it has no
media query, so it cannot follow the theme: a player on the dark theme still
gets the light cardboard on the startup image and a dark page after it. Keep
this equal to `--color-page` in `app/index.tokens.css`.
