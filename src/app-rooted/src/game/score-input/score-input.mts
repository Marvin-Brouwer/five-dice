import { component } from '@rooted/components'
import { createStore, type Store } from '@rooted/store'

import { type ScoreField } from '../_logic/gameConstants.ts'
import { discard, isDiscarded, isFlushScore, score, type ValidScore } from '../_logic/score/score.ts'
import { calculateFlush, calculateScore } from '../_logic/score/scoreCalculator.ts'
import { isScoreApplicableToField } from '../_logic/score/scoreFieldValidator.ts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { rowDisplayLabels } from '../score-card/score-card.labels.ts'

import { DiceModal, type DiceTuple } from './dice-modal.mts'
import { RowOverlay, type RowOverlayField } from './row-overlay.mts'
import { inputActiveStore } from './input-active-store.mts'

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

		function syncActive() {
			const active = diceOpen.value || rowOpen.value || flushOpen.value
			if (inputActiveStore.value !== active) inputActiveStore.update(() => active)
		}
		diceOpen.on('change', signal, syncActive)
		rowOpen.on('change', signal, syncActive)
		flushOpen.on('change', signal, syncActive)

		let pendingDice: DiceTuple | undefined
		let pendingRow: ScoreField | undefined

		const liveAnnounce = element('p', {
			classes: styles.liveRegion,
			aria: { live: 'polite', atomic: 'true' },
		})

		function projectedScoreText(field: ScoreField, scoreValue: ValidScore): string {
			if (field === 'flush') {
				const padFlush = store.value.pad.flush
				const existing = isDiscarded(padFlush) ? [] : padFlush
				const value = calculateFlush([...existing, scoreValue])
				return value === 0 ? '.' : String(value)
			}
			const value = calculateScore(scoreValue, field)
			return value === 0 ? '.' : String(value)
		}

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
				const preview = applicable ? projectedScoreText(field, scoreValue) : '/'
				result.push({
					field,
					variant: applicable ? 'valid' : 'discard',
					preview,
				})
			}
			return result
		}

		function flushDiscardFields(): RowOverlayField[] {
			const pad = store.value.pad
			return allFields
				.filter(field => field !== 'flush' && pad[field] === undefined)
				.map(field => ({ field: field as ScoreField, variant: 'discard' as const, preview: '/' }))
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
			mode: 'apply',
			title: 'Select a row for this roll',
			availableFields: availableRowFields,
			pendingDice: () => pendingDice,
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
