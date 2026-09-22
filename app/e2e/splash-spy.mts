/**
 * Instrumentation for the hand-over from the splash to the app, installed
 * before the page loads.
 *
 * What the splash is for is a moment rather than a state: it has to be gone by
 * the time a test can look, and a test that only looks at the end cannot tell
 * whether it left on the right beat or a hundred milliseconds early over an
 * empty page. So record what `<main>` held at the instant the splash was told
 * to go, and assert on that afterwards.
 */

export type SplashSpy = {
	/**
	 * What `<main>` read at the moment `is-dismissed` landed on the splash, or
	 * `null` while it is still up. An empty string is the failure this guards:
	 * the splash left over a page with nothing on it.
	 */
	pageAtHandover: string | null
}

declare global {
	interface Window {
		__splash: SplashSpy
	}
}

/**
 * Runs in the page, before any application code. Written as a standalone
 * function so it can be handed to `addInitScript` directly.
 */
export function installSplashSpy() {
	const spy: SplashSpy = {
		pageAtHandover: null,
	}
	window.__splash = spy

	// This runs before the document has been parsed, so there is no
	// documentElement to hang an observer off yet, let alone a splash or a
	// <main>. The document itself is always there, and subtree reaches the
	// rest of it as it arrives.
	new MutationObserver(() => {
		if (spy.pageAtHandover !== null) return

		const splash = document.querySelector('#splash')
		if (!splash?.classList.contains('is-dismissed')) return

		spy.pageAtHandover = (document.querySelector('#main-content')?.textContent ?? '').trim()
	}).observe(document, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['class'],
	})
}
