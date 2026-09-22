import { mutationObserver } from '@rooted/observers'

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

/** Fades the splash out and then takes it out of the document. */
function removeSplash(): void {
	const splash = document.querySelector('#splash')
	if (!splash) return

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
