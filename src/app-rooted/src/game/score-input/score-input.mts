import { component } from '@rooted/components'
import { createStore, type Store } from '@rooted/store'

import { type ScoreField } from '../_logic/gameConstants.ts'
import { scoreFieldOrder } from '../_logic/fields.ts'
import { discard, isDiscarded, isFlushScore, score, type ValidScore } from '../_logic/score/score.ts'
import { isScoreApplicableToField } from '../_logic/score/scoreFieldValidator.ts'
import { flushEntries, projectedCell } from '../_logic/score/scoreProjection.ts'
import type { GameContext } from '../_logic/game-context.mts'
import { LiveRegion } from '../../_shared/a11y/live-region.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { getRowDisplayLabels } from '../score-card/score-card.labels.ts'

import { DiceModal, type DiceTuple } from './dice-modal.mts'
import { RowOverlay, type RowOverlayField } from './row-overlay.mts'
import { inputActiveStore } from './input-active-store.mts'

export type ScoreInputOptions = {
	game: GameContext
	openRequest: Store<boolean>
	onCommit?: () => void
}

const allFields = scoreFieldOrder

export const ScoreInput = component<ScoreInputOptions>({
	name: 'score-input',
	onMount({ append, element, create, signal, options }) {
		const { game, openRequest } = options
		const { pad: store, selection, rows } = game

		const diceOpen = createStore(false)
		const rowOpen = createStore(false)
		const flushOpen = createStore(false)

		function syncActive() {
			const active = diceOpen.value || rowOpen.value || flushOpen.value
			if (inputActiveStore.value !== active) inputActiveStore.update(() => active)
		}
		diceOpen.on('change', signal, syncActive)
		rowOpen.on('change', signal, syncActive)
		flushOpen.on('change', signal, syncActive)

		let pendingDice: DiceTuple | undefined
		let pendingRow: ScoreField | undefined

		let liveAnnounce!: HTMLElement
		const liveRegion = create(LiveRegion, { ref: region => { liveAnnounce = region } })

		function availableRowFields(): RowOverlayField[] {
			if (!pendingDice) return []
			const scoreValue = score(pendingDice)
			const pad = store.value.pad
			const result: RowOverlayField[] = []
			for (const field of allFields) {
				const cell = pad[field]
				if (field === 'flush') {
					// Flush slot is special: discarded → done; otherwise still selectable
					// (and applicable flushes after the first will need a discard step).
					if (cell !== undefined && isDiscarded(cell)) continue
				}
				else if (cell !== undefined) {
					continue
				}
				const applicable = isScoreApplicableToField(scoreValue, field)
				result.push({
					field,
					variant: applicable ? 'valid' : 'discard',
					// The card renders this through its normal row renderer, so
					// the score text, the dice and the flush badge all come out
					// of the same code path as the committed row. A row that
					// isn't applicable previews as an actual discard.
					previewCell: applicable ? projectedCell(pad, field, scoreValue) : discard(),
				})
			}
			return result
		}

		function flushDiscardFields(): RowOverlayField[] {
			const pad = store.value.pad
			return allFields
				.filter(field => field !== 'flush' && pad[field] === undefined)
				.map(field => ({ field: field as ScoreField, variant: 'discard' as const, previewCell: discard() }))
		}

		/** A second or later flush has to sacrifice another row. */
		function flushNeedsDiscard(): boolean {
			return flushEntries(store.value.pad).length > 0
		}

		function applyAndReset(field: ScoreField, flushDiscardField?: Exclude<ScoreField, 'flush'>) {
			if (!pendingDice) return
			const scoreValue = score(pendingDice)
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
				options.onCommit?.()
			}
			catch (e) {
				liveAnnounce.textContent = (e as Error).message
			}
			pendingDice = undefined
			pendingRow = undefined
		}

		openRequest.on('change', signal, ({ detail }) => {
			if (!detail.state) return
			openRequest.update(() => false)
			if (store.gameEnded()) return
			pendingDice = undefined
			pendingRow = undefined
			diceOpen.update(() => true)
		})

		const diceModal = create(DiceModal, {
			open: diceOpen,
			initialDice: () => pendingDice,
			onConfirm(dice) {
				pendingDice = dice
				rowOpen.update(() => true)
			},
			onCancel() {
				pendingDice = undefined
			},
		})

		const rowOverlay = create(RowOverlay, {
			open: rowOpen,
			mode: 'apply',
			selection,
			rows,
			title: localization.text`Select a row for this roll`,
			availableFields: availableRowFields,
			onConfirm(field) {
				pendingRow = field
				if (field === 'flush' && pendingDice
					&& isScoreApplicableToField(score(pendingDice), 'flush')
					&& flushNeedsDiscard()) {
					flushOpen.update(() => true)
					return
				}
				applyAndReset(field)
			},
			onCancel() {
				// Back to the dice keyboard.
				pendingRow = undefined
				diceOpen.update(() => true)
			},
		})

		const flushOverlay = create(RowOverlay, {
			open: flushOpen,
			mode: 'discard',
			selection,
			rows,
			title: localization.text`Choose a row to discard for this flush`,
			availableFields: flushDiscardFields,
			onConfirm(field) {
				if (!pendingRow) return
				applyAndReset(pendingRow, field as Exclude<ScoreField, 'flush'>)
			},
			onCancel() {
				// Back to the row picker if the user cancels flush discard.
				rowOpen.update(() => true)
			},
		})

		append(diceModal, rowOverlay, flushOverlay, liveRegion)
	},
})
