import { component } from '@rooted/components'

import styles from './live-region.css'

export type LiveRegionOptions = {
	/** How assertively announcements interrupt. Defaults to 'polite'. */
	live?: 'polite' | 'assertive'
	/**
	 * Receives the element so the owner can announce by assigning
	 * `textContent`.
	 *
	 * Called once, during *this* component's mount — which is a microtask
	 * after the caller's own `onMount`. Callers that announce synchronously
	 * while mounting must buffer the text and flush it here.
	 */
	reference: (element: HTMLElement) => void
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
	onMount({ append, element, options }) {

		const region = append(
			element('p', {
				classes: styles.liveRegion,
				aria: { live: options.live ?? 'polite', atomic: 'true' },
			})
		)

		options.reference(region)
	},
})
