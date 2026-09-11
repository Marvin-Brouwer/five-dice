import { component } from '@rooted/components'

import { ContentCard } from '../_layout/content-card.mts'

import { GuideBasics } from './guide-basics.mts'
import { GuideClose } from './guide-close.mts'
import { GuideDiscard } from './guide-discard.mts'
import { GuideEnding } from './guide-ending.mts'
import { GuideExample } from './guide-example.mts'
import { GuideFlush } from './guide-flush.mts'
import { GuideUndo } from './guide-undo.mts'
import styles from './how-to-play.css'

/**
 * Class names across the guide are `guide-` prefixed on purpose. A component's
 * stylesheet is scoped to its host's *subtree*, so a bare `.row` or `.sheet`
 * would also restyle the score sections, menu rows and paper card mounted
 * inside it.
 *
 * Every section declares `how-to-play.css`, so they all share the one scope
 * and the shared render functions in `guide-parts.mts` work inside any of them.
 */
export const HowToPlay = component({
	name: 'how-to-play-page',
	styles,
	onMount({ append, element, create }) {
		append(
			create(ContentCard, {
				children: element('div', {
					classes: styles.guide,
					children: [
						create(GuideBasics),
						create(GuideExample),
						create(GuideDiscard),
						create(GuideFlush),
						create(GuideUndo),
						create(GuideEnding),
						create(GuideClose),
					],
				}),
			})
		)
	},
})
