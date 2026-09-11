export type NavigationGuard = {
	/**
	 * Asked before every in-app navigation away from the guarded page.
	 *
	 * Return the question to put to the player, or `undefined` to let the
	 * navigation through. `destination` is a `location.pathname`, app base and
	 * all, so it compares directly against an `href.for(...)` result.
	 */
	ask(destination: string): string | undefined
	/**
	 * Called when the player answers yes, before the router is let at the
	 * event. Only ever after an actual question — a navigation `ask` waved
	 * through was never in doubt, and nothing was confirmed.
	 *
	 * This is where whatever the question warned about gets carried out. A
	 * prompt whose warning turns out not to be true is worse than no prompt.
	 */
	onConfirmed?(): void
}

type ActiveGuard = NavigationGuard & {
	/** Where the guarded page lives. A declined navigation is sent back here. */
	origin: string
}

let activeGuard: ActiveGuard | undefined

/**
 * Confirm before the player is navigated off the current page.
 *
 * `beforeunload` covers a reload or a link out of the app, but it says
 * nothing about routing *inside* the app: the router turns both a `Link`
 * click and a back/forward press into a `popstate`, and neither one asks the
 * player anything. This is that prompt.
 *
 * One guard at a time — a second call replaces the first, and only the page
 * that installed a guard can clear it, so a remount that registers before the
 * outgoing page aborts (a locale switch does exactly that) doesn't leave the
 * app unguarded.
 *
 * @param guard - What to ask, and what to do about a yes. See {@link NavigationGuard}.
 * @param signal - The guarded page's lifetime. The guard is dropped on abort.
 */
export function guardNavigation({ ask, onConfirmed }: NavigationGuard, signal: AbortSignal): void {
	const guard: ActiveGuard = {
		ask,
		onConfirmed,
		origin: location.pathname,
	}
	activeGuard = guard

	signal.addEventListener('abort', () => {
		if (activeGuard === guard) activeGuard = undefined
	})
}

/**
 * Registered at module scope, and imported for its side effect from
 * `application.mts` — which is what puts it ahead of every `popstate`
 * listener the app has, the router's included, because those are all
 * registered from a component's `onMount` and this one is registered while
 * the module graph is still being evaluated.
 *
 * Listeners on the same target fire in registration order, so being first is
 * what lets `stopImmediatePropagation` hold a navigation back: the router
 * never sees the event, and nothing is rendered to undo.
 */
if (typeof window !== 'undefined') {
	window.addEventListener('popstate', (event) => {
		const guard = activeGuard
		if (!guard) return

		const destination = location.pathname
		if (destination === guard.origin) return

		const question = guard.ask(destination)
		if (question === undefined) return

		if (confirm(question)) {
			guard.onConfirmed?.()
			return
		}

		event.stopImmediatePropagation()
		// The history entry the player asked for is already current — whether
		// they clicked a link (the router pushed it) or pressed back (the
		// browser moved to it). Push the guarded page back on top so the URL
		// matches what is still on screen.
		history.pushState(undefined, '', guard.origin)
	})
}
