import { component } from '@rooted/components'

import { createScorePadStore } from '../../game/logic/scorePadStore.mts'
import { createScorePad } from '../../game/logic/score/scorePad.ts'
import { discard } from '../../game/logic/score/score.ts'
import { createRowRegistry } from '../../game/score-card/row-registry.mts'
import { ScoreSection } from '../../game/score-card/score-section.mts'
import { createSelectionStore } from '../../game/score-card/selection-store.mts'
import { localization } from '../../_shared/i18n/localization.mts'

import { figure, proseBlock } from './parts.mts'
import styles from '../how-to-play.css'

/** Giving a row up, shown with a real section of the card rather than a drawing. */
export const GuideDiscard = component({
	name: 'guide-discard',
	styles,
	async onMount({ append, element, create }) {
		const prose = await localization.branch({
			en: () => import('./discard.en.md'),
			nl: () => import('./discard.nl.md'),
		})

		// One real section of the card with its only row given up on, so the
		// slash across it is the card's own rather than a drawing of one.
		const discarded = createScorePadStore()
		discarded.update(state => {
			state.pad = {
				...createScorePad(),
				chance: discard(),
			}
		})

		const context = {
			element,
			create,
		}

		append(
			// Runs straight on from the example table above, so the heading
			// loses its top margin.
			proseBlock(context, prose, true),
			// Boxed like the keypad is: the illustration wrapper stays, and
			// the ruled card frame sits inside it.
			figure(context, localization.text`A discarded row`,
				element('div', {
					classes: styles.guideFigureCard,
					children: create(ScoreSection, {
						store: discarded,
						selection: createSelectionStore(),
						rows: createRowRegistry(),
						title: localization.text`Part two`,
						fields: ['chance'],
						withDieIcon: false,
					}),
				})
			),
		)
	},
})
