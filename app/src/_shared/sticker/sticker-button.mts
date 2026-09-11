import { component } from '@rooted/components'
import type { CssClass } from '@rooted/components'
import type { Aria, HtmlElementProperties } from '@rooted/elements'

import styles from './sticker-button.css'

export type StickerButtonOptions = {
	/** Label text. `\n` breaks the line, as the card's "Enter\nscore" does. */
	label: string
	aria?: Pick<Aria, 'label'>
	/** Forwarded to the button, same shape as `element('button', { on })`. */
	on?: HtmlElementProperties<'button'>['on']
	/** Placement, from whichever owner is positioning it. */
	classes?: CssClass
	/**
	 * Receives the button so the owner can drive state on it — hidden,
	 * disabled, tab order. Called once, during *this* component's mount, which
	 * is a microtask after the caller's own `onMount`.
	 */
	reference?: (button: HTMLButtonElement) => void
}

/**
 * A paper sticker slapped onto whatever it sits on: round, rotated, thick white
 * border, mono caps label, soft shadow so it reads as physical.
 *
 * Only the look lives here. Placement belongs to the owner, through `classes` —
 * the score card hangs one off its corner, the guide shows one in a figure.
 */
export const StickerButton = component<StickerButtonOptions>({
	name: 'sticker-button',
	styles,
	onMount({ append, element, options }) {
		const { label, aria, on, classes, reference } = options

		const button = append(
			element('button', {
				type: 'button',
				classes: [
					styles.sticker,
					classes,
				],
				aria,
				on,
				children: element('span', {
					classes: styles.stickerLabel,
					textContent: label,
				}),
			})
		)

		reference?.(button)
	},
})
