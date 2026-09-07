/**
 * Scroll the window to an absolute offset, at the motion the reader asked for.
 *
 * Every caller is moving the page on the reader's behalf rather than following
 * a scroll they started themselves, so the setting is read on each call: it
 * can be changed mid-session, and a cached answer would keep animating at
 * someone who has just turned animation off.
 *
 * Absolute rather than relative on purpose. Callers that have to know where
 * they will land -- to give the position back afterwards, or to decide they
 * are already there -- cannot work with a delta the browser may clamp.
 */
export function scrollPageTo(top: number) {
	const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
	window.scrollTo({
		top,
		behavior: reduceMotion ? 'auto' : 'smooth',
	})
}
