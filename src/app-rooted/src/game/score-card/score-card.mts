import { component } from '@rooted/components'

import { partOneFields, partTwoFields } from '../_logic/fields.ts'
import type { GameContext } from '../_logic/game-context.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { Masthead } from '../../_shared/masthead/masthead.mts'
import { PaperCard } from '../../_shared/paper-card/paper-card.mts'

import { EnterScoreSticker } from './enter-score-sticker.mts'
import { PlayerNameField } from './player-name-field.mts'
import { RoundLabel } from './round-label.mts'
import { ScoreSection } from './score-section.mts'
import { TotalsTable } from './totals-table.mts'
import styles from './score-card.css'

export type ScoreCardOptions = {
	game: GameContext
}

/**
 * The score pad.
 *
 * Pure composition — every part that changes owns its own store subscription,
 * so nothing here re-renders. The one thing this file does own is the
 * card-level `data-selecting` attribute, mirrored from the selection store.
 */
export const ScoreCard = component<ScoreCardOptions>({
	name: 'score-card',
	styles,
	onMount({ replace, element, create, signal, options }) {
		const { game } = options
		const { pad: store, flow, selection, rows } = game

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
				create(RoundLabel, {
					store,
				}),
			],
		})

		const cardInner = element('div', {
			classes: styles.cardInner,
			children: [
				cardHeader,
				banner,
				create(ScoreSection, {
					store,
					selection,
					rows,
					title: localization.text`Part one`,
					fields: partOneFields,
					withDieIcon: true,
				}),
				create(ScoreSection, {
					store,
					selection,
					rows,
					title: localization.text`Part two`,
					fields: partTwoFields,
					withDieIcon: false,
				}),
				create(TotalsTable, {
					store,
				}),
			],
		})

		const card = create(PaperCard, {
			// Page anchor and test hook; no longer a component contract.
			id: 'score-card',
			role: 'document',
			// The app's letterhead, above the rule. The `Score card` band
			// inside the frame names the pad itself, and stays.
			heading: create(Masthead),
			children: cardInner,
			// Outside the ruled frame, so the sticker can overhang the paper.
			overlay: create(EnterScoreSticker, {
				store,
				flow,
			}),
		})

		// Card-level selection state. The stylesheet uses it to dim and
		// highlight rows while the row picker is open.
		function syncSelecting() {
			const { mode } = selection.value
			if (mode === 'none') delete cardInner.dataset.selecting
			else cardInner.dataset.selecting = mode
		}
		syncSelecting()
		selection.on('change', signal, syncSelecting)

		replace(card)
	},
})
