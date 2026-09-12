/**
 * Keeps the browser chrome — the minimal-ui toolbar, the mobile status bar —
 * on the same colour as the page the app bar sits on.
 *
 * index.html ships a `(prefers-color-scheme: light)` / `dark` pair of
 * `theme-color` metas so the very first paint is already cardboard. Those only
 * ever follow the OS, though, and the player can override the theme (light /
 * dark / ambient-light sensor). The browser picks the first `theme-color` meta
 * whose media matches, so this module owns one media-less meta placed ahead of
 * the pair: once the theme has resolved, that one always wins.
 *
 * The colour itself is read back from `--color-page` rather than duplicated
 * here, so index.tokens.css / index.theme.css stay the single source of truth.
 */

const META_SELECTOR = 'meta[name="theme-color"]'

let resolvedMeta: HTMLMetaElement | undefined

function ensureMeta(): HTMLMetaElement {
	if (resolvedMeta) return resolvedMeta

	resolvedMeta = document.createElement('meta')
	resolvedMeta.name = 'theme-color'
	document.head.insertBefore(resolvedMeta, document.head.querySelector(META_SELECTOR))

	return resolvedMeta
}

/** Repaint the browser chrome with the `--color-page` of the theme now applied. */
export function syncThemeColor() {
	if (typeof document === 'undefined') return

	const pageColor = getComputedStyle(document.documentElement)
		.getPropertyValue('--color-page')
		.trim()
	if (!pageColor) return

	ensureMeta().content = pageColor
}
