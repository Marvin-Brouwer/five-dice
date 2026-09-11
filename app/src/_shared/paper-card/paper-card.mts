import { component } from '@rooted/components'
import type { ElementChild, ElementChildren } from '@rooted/elements'

import styles from './paper-card.css'

export type PaperCardOptions = {
	/** Content inside the ruled frame. */
	children?: ElementChildren
	/** One node laid on the sheet above the ruled frame: the card's
	    letterhead. Outside the frame, like the overlay, because the band
	    reaches the paper's edge rather than the rule's. */
	heading?: ElementChild
	/** One node placed on the sheet but outside the frame, for anything that
	    hangs over the ruled edge — the score card's sticker does. */
	overlay?: ElementChild
	/** Set on the sheet, the element callers anchor to. */
	id?: string
	role?: string
}

/**
 * The app's paper look: a textured sheet on the cardboard page with an ink
 * rule just inside its edge. The score card is one, and so is the landing
 * page, which is why this lives here rather than in the game.
 *
 * The sheet is the container-query container, so content can size against the
 * paper's width. The overlay hangs off the ruled frame rather than the sheet,
 * which is what keeps it clear of a heading band above it.
 */
export const PaperCard = component<PaperCardOptions>({
	name: 'paper-card',
	styles,
	onMount({ append, element, options }) {
		const { children, heading, overlay, id, role } = options

		// Wrapped rather than appended as-is: the gap between the band and the
		// rule below it is the card's, not the caller's.
		const headingSlot = heading === undefined
			? undefined
			: element('div', {
				classes: styles.heading,
				children: heading,
			})

		append(element('section', {
			id,
			role,
			classes: styles.sheet,
			children: [
				headingSlot,
				element('div', {
					classes: styles.frameSlot,
					children: [
						element('div', {
							classes: styles.frame,
							children,
						}),
						overlay,
					],
				}),
			],
		}))
	},
})
