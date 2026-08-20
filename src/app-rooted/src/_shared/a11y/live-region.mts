import { component } from '@rooted/components'

import styles from './live-region.css'

export type LiveRegionOptions = {
	/** How assertively announcements interrupt. Defaults to 'polite'. */
	live?: 'polite' | 'assertive'
	/**
	 * Receives the element so the owner can announce by assigning
	 * `textContent`. Called once, at mount.
	 */
	ref: (element: HTMLElement) => void
}

/**
 * A visually hidden `aria-live` region.
 *
 * Announcements are made by writing `textContent` on the element handed to
 * `ref` — there is no store here on purpose, because announcing the same text
 * twice has to re-fire, and a store's 'change' event would swallow that.
 */
export const LiveRegion = component<LiveRegionOptions>({
	name: 'live-region',
	styles,
	onMount({ replace, element, options }) {
		const region = element('p', {
			classes: styles.liveRegion,
			aria: { live: options.live ?? 'polite', atomic: 'true' },
		})
		options.ref(region)
		replace(region)
	},
})
