import { component } from '@rooted/components'
import { createStore, type Store } from '@rooted/store'

import { type ScoreField } from '../_logic/gameConstants.ts'
import { discard, isDiscarded, isFlushScore, score } from '../_logic/score/score.ts'
import { isScoreApplicableToField } from '../_logic/score/scoreFieldValidator.ts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { rowDisplayLabels } from '../score-card/score-card.labels.ts'

import { DiceModal, type DiceTuple } from './dice-modal.mts'
import { RowOverlay, type RowOverlayField } from './row-overlay.mts'

import styles from './score-input.css'

export type ScoreInputOptions = {
	store: ScorePadStore
	openRequest: Store<boolean>
	onCommit?: () => void
}

const allFields = Object.keys(rowDisplayLabels) as ScoreField[]

export const ScoreInput = component<ScoreInputOptions>({
	name: 'score-input',
	styles,
	onMount({ append, element, create, signal, options }) {
		const { store, openRequest } = options

		const diceOpen = createStore(false)
		const rowOpen = createStore(false)
		const flushOpen = createStore(false)

		let pendingDice: DiceTuple | undefined
		let pendingRow: ScoreField | undefined

		const liveAnnounce = element('p', {
			classes: styles.liveRegion,
			aria: { live: 'polite', atomic: 'true' },
		})

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
				result.push({ field, variant: applicable ? 'valid' : 'discard' })
			}
			return result
		}

		function flushDiscardFields(): RowOverlayField[] {
			const pad = store.value.pad
			return allFields
				.filter(field => field !== 'flush' && pad[field] === undefined)
				.map(field => ({ field: field as ScoreField, variant: 'discard' as const }))
		}

		function flushNeedsDiscard(): boolean {
			const flushCell = store.value.pad.flush
			if (isDiscarded(flushCell)) return false
			return isFlushScore(flushCell) && flushCell.length > 0
		}

		function applyAndReset(field: ScoreField, flushDiscardField?: Exclude<ScoreField, 'flush'>) {
			if (!pendingDice) return
			const scoreValue = score(pendingDice)
			try {
				if (!isScoreApplicableToField(scoreValue, field)) {
					store.apply({ field, score: discard() })
					liveAnnounce.textContent = `Discarded ${rowDisplayLabels[field].title}.`
				}
				else if (field === 'flush') {
					if (flushDiscardField) {
						store.apply({ field: 'flush', score: scoreValue, discard: flushDiscardField })
						liveAnnounce.textContent = `Flush applied. Discarded ${rowDisplayLabels[flushDiscardField].title}.`
					}
					else {
						store.apply({ field: 'flush', score: scoreValue })
						liveAnnounce.textContent = 'First flush applied.'
					}
				}
				else {
					store.apply({ field, score: scoreValue })
					liveAnnounce.textContent = `Applied ${rowDisplayLabels[field].title}.`
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
			title: 'Select a row for this roll',
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
				pendingDice = undefined
				pendingRow = undefined
			},
		})

		const flushOverlay = create(RowOverlay, {
			open: flushOpen,
			title: 'Choose a row to discard for this flush',
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

		append(diceModal, rowOverlay, flushOverlay, liveAnnounce)
	},
})
