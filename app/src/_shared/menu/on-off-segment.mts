import { component, type CssClass } from '@rooted/components'
import type { Aria } from '@rooted/elements'
import type { Store } from '@rooted/store'

import { localization } from '../i18n/localization.mts'

import styles from './on-off-segment.css'

export type OnOffSegmentOptions = {
	store: Store<boolean>
	aria: Pick<Aria, 'label'>
	idPrefix: string
}

type SegmentLabelOptions = {
	class: CssClass
	text: string
}

/** One unselectable label of the switch: the `styles.segment` base class
    plus the on/off-specific variant class passed in via `classes`. */
const SegmentLabel = component<SegmentLabelOptions>({
	name: 'on-off-segment-label',
	onMount({ append, element, options }) {
		append(
			element('span', {
				classes: [
					styles.segment,
					options.class,
				],
				textContent: options.text,
				aria: {
					hidden: 'true',
				},
			})
		)
	},
})

/** Single-tap toggle rendered as an On / Off segmented switch. Clicking
    anywhere on the control flips the store; the labels themselves are
    unselectable so a mis-clicked drag doesn't turn into a text selection. */
export const OnOffSegment = component<OnOffSegmentOptions>({
	name: 'on-off-segment',
	styles,
	onMount({ append, element, create, signal, options }) {
		const { store, aria } = options

		function sync() {
			const value = store.value
			button.setAttribute('aria-checked', String(value))
			button.dataset.state = value ? 'on' : 'off'
		}

		const button = append(
			element('button', {
				type: 'button',
				role: 'switch',
				aria: {
					label: aria.label,
					checked: String(store.value)
				},
				classes: styles.group,
				children: [
					create(SegmentLabel, {
						class: styles.segmentOn,
						text: localization.text`On`
					}),
					create(SegmentLabel, {
						class: styles.segmentOff,
						text: localization.text`Off`
					}),
				],
				on: {
					click() {
						store.update(prev => !prev)
					},
				},
			})
		)

		store.on('change', signal, sync)
		sync()
	},
})
