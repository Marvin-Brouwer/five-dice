import { component } from '@rooted/components'

import { StartGameButton } from '../../game/start-game-button.mts'
import { localization } from '../../_shared/i18n/localization.mts'

import styles from '../how-to-play.css'

/** Closes the instructions and hands over to the game. */
export const GuideClose = component({
	name: 'guide-close',
	styles,
	onMount({ append, element, create }) {
		append(
			// Closes the instructions before the call to action, the way
			// the card's bands close a section. Empty on purpose: it is a
			// rule, not a heading, so it carries its meaning as a label.
			element('hr', {
				classes: styles.guideEnd,
				aria: {
					label: localization.text`End of the instructions`,
				},
			}),
			element('p', {
				classes: styles.guideActions,
				children: create(StartGameButton),
			}),
		)
	},
})
