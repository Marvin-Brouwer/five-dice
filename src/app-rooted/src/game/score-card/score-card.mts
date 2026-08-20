import { component } from '@rooted/components'
import type { Store } from '@rooted/store'

import { partOneFields, partTwoFields } from '../_logic/fields.ts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { localization } from '../../_shared/i18n/localization.mts'

import { EnterScoreSticker } from './enter-score-sticker.mts'
import { PlayerNameField } from './player-name-field.mts'
import { RoundLabel } from './round-label.mts'
import { ScoreSection } from './score-section.mts'
import { TotalsTable } from './totals-table.mts'
import styles from './score-card.css'

export type ScoreCardOptions = {
	store: ScorePadStore
	openRequest: Store<boolean>
}

/**
 * The score pad.
 *
 * Pure composition — every part that changes owns its own store subscription,
 * so nothing here re-renders. What this file does own is the card-level
 * selection state (`data-selecting` on `.card`, set by row-overlay), which its
 * stylesheet uses to dim and highlight rows during row selection.
 */
export const ScoreCard = component<ScoreCardOptions>({
	name: 'score-card',
	styles,
	onMount({ replace, element, create, options }) {
		const { store, openRequest } = options

		const cardHeader = element('header', {
			classes: styles.cardHeader,
			children: element('span', {
				classes: styles.cardTitle,
				textContent: localization.text`Score card`,
			}),
		})

		const banner = element('aside', {
			role: 'banner',
			classes: styles.banner,
			children: [
				create(PlayerNameField),
				create(RoundLabel, { store }),
			],
		})

		const cardInner = element('div', {
			classes: styles.cardInner,
			children: [
				cardHeader,
				banner,
				create(ScoreSection, {
					store,
					title: localization.text`Part one`,
					fields: partOneFields,
					withDieIcon: true,
				}),
				create(ScoreSection, {
					store,
					title: localization.text`Part two`,
					fields: partTwoFields,
					withDieIcon: false,
				}),
				create(TotalsTable, { store }),
			],
		})

		replace(element('section', {
			// row-overlay locates the card by this id.
			id: 'score-card',
			classes: styles.card,
			role: 'document',
			children: [
				cardInner,
				create(EnterScoreSticker, { store, openRequest }),
			],
		}))
	},
})
