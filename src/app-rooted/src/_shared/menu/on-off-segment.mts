import { component } from '@rooted/components'
import type { Store } from '@rooted/store'

import styles from './on-off-segment.css'

export type OnOffSegmentOptions = {
	store: Store<boolean>
	ariaLabel: string
	idPrefix: string
}

/** Two-segment radio group rendering as On / Off buttons wired to a Store<boolean>. */
export const OnOffSegment = component<OnOffSegmentOptions>({
	name: 'on-off-segment',
	styles,
	onMount({ append, element, signal, options }) {
		const { store, ariaLabel, idPrefix } = options
		const onId = `${idPrefix}-on`
		const offId = `${idPrefix}-off`

		const onRadio = element('input', {
			type: 'radio',
			id: onId,
			name: `${idPrefix}-group`,
			classes: styles.visuallyHidden,
			checked: store.value === true,
			on: {
				change: () => store.update(() => true),
			},
		})
		const offRadio = element('input', {
			type: 'radio',
			id: offId,
			name: `${idPrefix}-group`,
			classes: styles.visuallyHidden,
			checked: store.value === false,
			on: {
				change: () => store.update(() => false),
			},
		})

		store.on('change', signal, ({ detail }) => {
			onRadio.checked = detail.state === true
			offRadio.checked = detail.state === false
		})

		append(
			element('div', {
				role: 'radiogroup',
				aria: { label: ariaLabel },
				classes: styles.group,
				children: [
					onRadio,
					element('label', {
						htmlFor: onId,
						classes: [styles.segment, styles.segmentOn],
						textContent: 'On',
					}),
					offRadio,
					element('label', {
						htmlFor: offId,
						classes: [styles.segment, styles.segmentOff],
						textContent: 'Off',
					}),
				],
			}),
		)
	},
})
