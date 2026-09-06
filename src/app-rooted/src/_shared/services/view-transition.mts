/**
 * Silence the "Transition was skipped" the console reports on an interrupted
 * navigation.
 *
 * The router runs every route render through `startViewTransition` (see
 * `viewTransition: true` in `application.mts`) and drops the object it hands
 * back. Start a second transition before the first has finished and the
 * browser skips the first, rejecting its `ready` with an `AbortError` that
 * nobody is holding — so it surfaces as an uncaught error.
 *
 * It is easy to hit: a route resolves through a dynamic import, so a
 * back/forward press that lands on a page still fetching its chunk overlaps
 * two navigations. The score card, the heaviest chunk in the app, is where it
 * shows up most.
 *
 * Attaching a handler doesn't change the promise for anyone else — it only
 * marks the rejection as handled. `finished` and `updateCallbackDone` are
 * deliberately left alone: those carry real render errors, and a skip does
 * not reject them.
 *
 * TODO: drop this once the router holds on to its own transition promises.
 * https://github.com/Marvin-Brouwer/rooted/issues
 */
if (typeof document !== 'undefined' && 'startViewTransition' in document) {
	const startViewTransition = document.startViewTransition

	document.startViewTransition = function (...parameters) {
		const transition = startViewTransition.apply(this, parameters)
		transition.ready.catch(() => {})
		return transition
	}
}
