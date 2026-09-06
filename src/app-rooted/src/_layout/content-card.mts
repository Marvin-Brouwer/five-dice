import { component } from '@rooted/components'
import type { ElementChildren } from '@rooted/elements'

import { PaperCard } from '../_shared/paper-card/paper-card.mts'

import { Doormat } from './doormat/doormat.mts'
import styles from './content-card.css'

export type ContentCardOptions = {
	/** Content placed inside the card's ruled frame. */
	children?: ElementChildren
}

/**
 * A page of prose: one sheet of paper, with the doormat below it.
 *
 * The two travel together on every page that is reading rather than playing —
 * the landing page, the guide and the accessibility statement — so they are
 * one component rather than a pairing each page has to remember to repeat.
 *
 * The doormat is a sibling of the article rather than part of it, which keeps
 * it out of the card's measure and out of any centring the page applies to
 * that article.
 */
export const ContentCard = component<ContentCardOptions>({
	name: 'content-card',
	styles,
	onMount({ append, element, create, options }) {
		append(
			element('article', {
				classes: styles.contentPage,
				children: create(PaperCard, {
					children: options.children,
				}),
			}),
			create(Doormat)
		)
	},
})
