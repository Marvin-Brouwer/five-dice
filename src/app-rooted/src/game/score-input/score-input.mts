import { component } from '@rooted/components'

import { type ScoreField } from '../_logic/gameConstants.ts'
import { discard, score } from '../_logic/score/score.ts'
import { isScoreApplicableToField } from '../_logic/score/scoreFieldValidator.ts'
import { projectedCell } from '../_logic/score/scoreProjection.ts'
import type { GameContext } from '../_logic/game-context.mts'
import { LiveRegion } from '../../_shared/a11y/live-region.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { getRowDisplayLabels } from '../score-card/score-card.labels.ts'

import { DiceModal } from './dice-modal.mts'
import { availableRowFields, flushDiscardFields, flushNeedsDiscard } from './row-fields.mts'
import { RowOverlay } from './row-overlay.mts'

export type ScoreInputOptions = {
	game: GameContext
}

export const ScoreInput = component<ScoreInputOptions>({
	name: 'score-input',
	onMount({ append, element, create, signal, options }) {
		const { game } = options
		const { pad: store, flow, selection, rows } = game

		let liveAnnounce!: HTMLElement
		const liveRegion = create(LiveRegion, { ref: region => { liveAnnounce = region } })

		function applyAndClose(field: ScoreField, flushDiscardField?: Exclude<ScoreField, 'flush'>) {
			const dice = flow.value.dice
			if (!dice) return
			const scoreValue = score(dice)
			try {
				if (!isScoreApplicableToField(scoreValue, field)) {
					store.apply({ field, score: discard() })
					liveAnnounce.textContent = localization.text`Discarded ${getRowDisplayLabels()[field].title}.`
				}
				else if (field === 'flush') {
					if (flushDiscardField) {
						store.apply({ field: 'flush', score: scoreValue, discard: flushDiscardField })
						liveAnnounce.textContent = localization.text`Flush applied. Discarded ${getRowDisplayLabels()[flushDiscardField].title}.`
					}
					else {
						store.apply({ field: 'flush', score: scoreValue })
						liveAnnounce.textContent = localization.text`First flush applied.`
					}
				}
				else {
					store.apply({ field, score: scoreValue })
					liveAnnounce.textContent = localization.text`Applied ${getRowDisplayLabels()[field].title}.`
				}
			}
			catch (e) {
				liveAnnounce.textContent = (e as Error).message
			}
			flow.close()
		}

		const diceModal = create(DiceModal, {
			flow,
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
