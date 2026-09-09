import { component } from '@rooted/components'

import { type ScoreField } from '../logic/gameConstants.ts'
import { discard, score } from '../logic/score/score.ts'
import { isScoreApplicableToField } from '../logic/score/scoreFieldValidator.ts'
import { projectedCell } from '../logic/score/scoreProjection.ts'
import type { GameContext } from '../logic/game-context.mts'
import { createAnnouncementStore, LiveRegion } from '../../_shared/a11y/live-region.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { getRowDisplayLabels } from '../score-card/score-card.labels.ts'

import { DiceModal } from './dice-modal.mts'
import { availableRowFields, flushDiscardFields, flushNeedsDiscard, openRowFields } from './row-fields.mts'
import { RowOverlay } from './row-overlay.mts'

export type ScoreInputOptions = {
	game: GameContext
}

export const ScoreInput = component<ScoreInputOptions>({
	name: 'score-input',
	onMount({ append, create, options }) {
		const { game } = options
		const { pad: store, flow, selection, rows } = game

		const announcement = createAnnouncementStore()
		function announce(text: string) {
			announcement.update(() => text)
		}
		const liveRegion = create(LiveRegion, {
			store: announcement,
		})

		function applyAndClose(field: ScoreField, flushDiscardField?: Exclude<ScoreField, 'flush'>) {
			const dice = flow.value.dice
			if (!dice) return
			const scoreValue = score(dice)
			try {
				if (!isScoreApplicableToField(scoreValue, field)) {
					store.apply({ field, score: discard() })
					announce(localization.text`Discarded ${getRowDisplayLabels()[field].title}.`)
				}
				else if (field === 'flush') {
					if (flushDiscardField) {
						store.apply({ field: 'flush', score: scoreValue, discard: flushDiscardField })
						announce(localization.text`Flush applied. Discarded ${getRowDisplayLabels()[flushDiscardField].title}.`)
					}
					else {
						store.apply({ field: 'flush', score: scoreValue })
						announce(localization.text`First flush applied.`)
					}
				}
				else {
					store.apply({ field, score: scoreValue })
					announce(localization.text`Applied ${getRowDisplayLabels()[field].title}.`)
				}
			}
			catch (e) {
				announce((e as Error).message)
			}
			flow.close()
		}

		const diceModal = create(DiceModal, {
			flow,
			// The picker's row set is the same before and after the roll, so
			// the keypad can already put those rows on screen.
			rowsSpan: () => rows.span(openRowFields(store.value.pad)),
			// The last move of the game hands the page to the totals, which
			// scroll themselves into view; putting the card back where the
			// keypad found it would only fight that.
			canRestoreScroll: () => !store.gameEnded(),
			onConfirm(dice) {
				flow.toRow(dice)
			},
			onCancel() {
				flow.close()
			},
		})

		const rowOverlay = create(RowOverlay, {
			flow,
			step: 'row',
			mode: 'apply',
			selection,
			rows,
			title: localization.text`Select a row for this roll`,
			availableFields: () => {
				const dice = flow.value.dice
				return dice ? availableRowFields(store.value.pad, dice) : []
			},
			onConfirm(field) {
				const dice = flow.value.dice
				if (field === 'flush' && dice
					&& isScoreApplicableToField(score(dice), 'flush')
					&& flushNeedsDiscard(store.value.pad)) {
					flow.toFlushDiscard(field)
					return
				}
				applyAndClose(field)
			},
			onCancel() {
				// Back to the dice keyboard, roll intact.
				flow.backToDice()
			},
		})

		const flushOverlay = create(RowOverlay, {
			flow,
			step: 'flushDiscard',
			mode: 'discard',
			selection,
			rows,
			// Show the flush being committed on its own row while the user
			// picks which row to sacrifice for it.
			pinnedPreview() {
				const dice = flow.value.dice
				if (!dice) return undefined
				return { field: 'flush', cell: projectedCell(store.value.pad, 'flush', score(dice)) }
			},
			title: localization.text`Choose a row to discard for this flush`,
			availableFields: () => flushDiscardFields(store.value.pad),
			onConfirm(field) {
				const pendingRow = flow.value.field
				if (!pendingRow) return
				applyAndClose(pendingRow, field as Exclude<ScoreField, 'flush'>)
			},
			onCancel() {
				// Back to the row picker if the user cancels flush discard.
				flow.backToRow()
			},
		})

		append(diceModal, rowOverlay, flushOverlay, liveRegion)
	},
})
