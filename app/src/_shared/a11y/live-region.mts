import { component } from '@rooted/components'
import { createStore, type Store } from '@rooted/store'

import styles from './live-region.css'

/** What a {@link LiveRegion} reads out. Empty means nothing to announce. */
export type AnnouncementStore = Store<string>

/**
 * A store to drive one {@link LiveRegion}.
 *
 * One per region, not one per app. Two regions sharing a store would both
 * announce, and a screen reader would read the same text twice — and the
 * region inside a modal `<dialog>` has to stay inside it, because everything
 * outside the top layer is inert to assistive tech while the dialog is open.
 */
export function createAnnouncementStore(): AnnouncementStore {
	return createStore('')
}

export type LiveRegionOptions = {
	/** How assertively announcements interrupt. Defaults to 'polite'. */
	live?: 'polite' | 'assertive'
	/** The text to read out. Announce by updating it. */
	store: AnnouncementStore
}

/**
 * A visually hidden `aria-live` region, reading out whatever its store holds.
 *
 * Subscribed to 'update' rather than 'change': announcing the same text twice
 * has to re-fire, and 'change' only fires when the state hash differs.
 */
export const LiveRegion = component<LiveRegionOptions>({
	name: 'live-region',
	styles,
	onMount({ append, element, options, signal }) {
		const { store } = options

		const region = append(
			element('p', {
				classes: styles.liveRegion,
				aria: {
					live: options.live ?? 'polite',
					atomic: 'true',
				},
			})
		)

		// This mount is a microtask after the caller's, so the store may
		// already hold something to say.
		region.textContent = store.value

		store.on('update', signal, ({ detail }) => {
			region.textContent = detail.state
		})
	},
})
