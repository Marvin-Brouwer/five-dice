import { component } from '@rooted/components'
import type { ElementChild, ElementChildren } from '@rooted/elements'

import styles from './paper-card.css'

export type PaperCardOptions = {
	/** Content inside the ruled frame. */
	children?: ElementChildren
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
 * The sheet is the container-query container and the positioning context, so
 * content can size against the paper's width and the overlay can overhang it.
 */
export const PaperCard = component<PaperCardOptions>({
	name: 'paper-card',
	styles,
	onMount({ append, element, options }) {
		const { children, overlay, id, role } = options

		append(element('section', {
			id,
			role,
			classes: styles.sheet,
			children: [
				element('div', {
					classes: styles.frame,
					children,
				}),
				overlay,
			],
		}))
	},
})
