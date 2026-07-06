import { component } from '@rooted/components'
import type { Store } from '@rooted/store'

import styles from './on-off-segment.css'

export type OnOffSegmentOptions = {
	store: Store<boolean>
	ariaLabel: string
	idPrefix: string
}

/** Single-tap toggle rendered as an On / Off segmented switch. Clicking
    anywhere on the control flips the store; the labels themselves are
    unselectable so a mis-clicked drag doesn't turn into a text selection. */
export const OnOffSegment = component<OnOffSegmentOptions>({
	name: 'on-off-segment',
	styles,
	onMount({ append, element, signal, options }) {
		const { store, ariaLabel } = options

		const onLabel = element('span', {
			classes: [styles.segment, styles.segmentOn],
			textContent: 'On',
			aria: { hidden: 'true' },
		})
		const offLabel = element('span', {
			classes: [styles.segment, styles.segmentOff],
			textContent: 'Off',
			aria: { hidden: 'true' },
		})

		const button = element('button', {
			type: 'button',
			role: 'switch',
			aria: { label: ariaLabel, checked: String(store.value) },
			classes: styles.group,
			children: [onLabel, offLabel],
			on: {
				click() {
					store.update(prev => !prev)
				},
			},
		})

		function sync() {
			const value = store.value
			button.setAttribute('aria-checked', String(value))
			button.dataset.state = value ? 'on' : 'off'
		}

		store.on('change', signal, sync)
		sync()

		append(button)
	},
})
