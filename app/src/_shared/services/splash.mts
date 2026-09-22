import { mutationObserver } from '@rooted/observers'
import { environment } from '@rooted/util'

/**
 * Stops the visual-viewport listeners once the splash is gone.
 *
 * Module state, like the splash itself: there is one of it per document, and
 * it never comes back.
 */
const onScreen = new AbortController()

/**
 * Take the cold-start splash down once `<main>` has a page in it.
 *
 * The splash itself is markup in index.html, dressed by index.splash.css --
 * see docs/loading-splash.md for why it is neither a component nor inside
 * `#app`.
 *
 * Deliberately not the router's own `navigate` `end`, which is the obvious
 * signal and the wrong one: the router renders inside a view transition and
 * announces the end of a navigation without waiting for it, so `end` arrives
 * while `<main>` is still empty. Worse, that is exactly when `/` is busiest --
 * CultureSelect answers a remembered locale by redirecting from its own mount,
 * so the page the player asked for is a second navigation away. Both come out
 * right by asking the only question that actually matters: is there anything
 * on the page yet?
 *
 * @param main - The app's `<main>`, which the router renders every route into.
 * @param signal - The application's lifetime; the observer stops with it.
 */
export function dismissSplashWhenPageIsUp(main: Element, signal: AbortSignal): void {
	if (showsAPage(main)) {
		removeSplash()
		return
	}

	mutationObserver({
		targets: main,
		childList: true,
		subtree: true,
		signal,
		on: {
			mutate({ observer }) {
				if (!showsAPage(main)) return

				observer.disconnect()
				removeSplash()
			},
		},
	})
}

/**
 * Whether there is anything in `<main>` for a player to look at.
 *
 * The router puts its own host there straight away, and a route may render
 * nothing at all -- CultureSelect does, on its way to somewhere else -- so the
 * presence of elements says nothing. Words or a drawing is the whole test: one
 * of the two is what every page in this app opens with.
 */
function showsAPage(main: Element): boolean {
	if ((main.textContent ?? '').trim().length > 0) return true

	return main.querySelector('svg, img, canvas') !== null
}

/**
 * Keep the splash over the part of the screen the player can actually see.
 *
 * `position: fixed` lays out against the layout viewport, not the visual one,
 * so on a pinch-zoomed page a full-screen overlay covers more than the screen
 * and its middle is somewhere off toward the bottom right. Android Chrome
 * keeps the zoom across a refresh and drops it on a fresh navigation, which is
 * why this only ever showed on a reload.
 *
 * Every fixed overlay in the app does this -- the menu sheet measures the same
 * offset -- but the splash is the one with nothing behind it to give the eye a
 * reference, so it reads as broken rather than as zoomed.
 *
 * It cannot help the frames before this module has run, which is some of what
 * the splash is there for. On a reload, where the zoom is restored and the
 * bundle is warm, it is most of them.
 */
function followVisualViewport(): void {
	const viewport = window.visualViewport
	if (!viewport) return

	sync()
	viewport.addEventListener('resize', sync, {
		signal: onScreen.signal,
	})
	viewport.addEventListener('scroll', sync, {
		signal: onScreen.signal,
	})
}

/** Lay the splash over the visual viewport rather than the layout one. */
function sync(): void {
	const splash = document.querySelector<HTMLElement>('#splash')
	const viewport = window.visualViewport
	if (!splash || !viewport) return

	const { offsetLeft, offsetTop, scale } = viewport
	if (scale === 1 && offsetLeft === 0 && offsetTop === 0) {
		// Unzoomed and unpanned the two viewports are the same box, and a
		// transform here would only cost a layer and a rounding error.
		splash.style.transform = ''
		return
	}

	// The visible box in layout pixels: shrink the overlay onto it from its top
	// left corner, then move that corner to where the visible box starts.
	splash.style.transformOrigin = '0 0'
	splash.style.transform = `translate(${offsetLeft}px, ${offsetTop}px) scale(${1 / scale})`
}

if (environment.hasDom) followVisualViewport()

/** Fades the splash out and then takes it out of the document. */
function removeSplash(): void {
	const splash = document.querySelector('#splash')
	if (!splash) return

	onScreen.abort()

	splash.classList.add('is-dismissed')

	const remove = () => splash.remove()
	splash.addEventListener('transitionend', remove, {
		once: true,
	})
	// A backstop for the cases transitionend does not come: a background tab
	// throttles the transition, and a reader who has asked for less motion may
	// have it cut somewhere this file cannot see.
	setTimeout(remove, fadeDuration(splash) * 2)
}

/**
 * How long the fade in index.splash.css actually runs, in milliseconds.
 *
 * Read rather than repeated, so the sheet stays the one place the timing is
 * written down. The computed value is a list when several properties
 * transition; `opacity` is the first and, here, the only one.
 *
 * Nothing means no fade -- an unstyled splash, or one whose transition has
 * been taken away -- and then no `transitionend` is coming either, so zero is
 * the answer rather than a stand-in for a missing one.
 */
function fadeDuration(splash: Element): number {
	const [declared = ''] = getComputedStyle(splash).transitionDuration.split(',')
	const time = Number.parseFloat(declared)
	if (!Number.isFinite(time)) return 0

	// A browser normalizes the computed value to seconds -- `0.24s` for a
	// declared `240ms`. happy-dom, which the unit tests run in, hands back what
	// was written instead, so the unit is read rather than taken on faith.
	return declared.trim().endsWith('ms') ? time : time * 1000
}
