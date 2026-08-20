import { createStore, type Store } from '@rooted/store'

import type { DiceTuple, ScoreField } from './gameConstants.ts'

/**
 * Where the score-entry wizard is: pick a roll, pick a row, and — for a
 * second or later flush — pick a row to sacrifice.
 */
export type InputStep = 'closed' | 'dice' | 'row' | 'flushDiscard'

export type InputFlowState = {
	step: InputStep
	/** The roll being entered. Survives Back from the row picker. */
	dice: DiceTuple | undefined
	/** The row chosen, held while a flush discard is picked. */
	field: ScoreField | undefined
}

export type InputFlowStore = Store<InputFlowState> & {
	open(): void
	toRow(dice: DiceTuple): void
	backToDice(): void
	toFlushDiscard(field: ScoreField): void
	backToRow(): void
	close(): void
	isActive(): boolean
}

function closedState(): InputFlowState {
	return { step: 'closed', dice: undefined, field: undefined }
}

/**
 * Transient — never persisted, and never read by the card's row rendering.
 * Only the sticker's inert state depends on it.
 *
 * Replaces what used to be three independent booleans plus two mutable
 * locals, where nothing stopped two dialogs being open at once.
 */
export function createInputFlowStore(): InputFlowStore {
	const store = createStore<InputFlowState>(closedState())

	function open() {
		store.update(() => ({ ...closedState(), step: 'dice' as const }))
	}

	function toRow(dice: DiceTuple) {
		store.update(state => {
			state.step = 'row'
			state.dice = dice
		})
	}

	function backToDice() {
		// Keeps the roll, so the slots repopulate rather than reset.
		store.update(state => {
			state.step = 'dice'
			state.field = undefined
		})
	}

	function toFlushDiscard(field: ScoreField) {
		store.update(state => {
			state.step = 'flushDiscard'
			state.field = field
		})
	}

	function backToRow() {
		store.update(state => {
			state.step = 'row'
			state.field = undefined
		})
	}

	function close() {
		store.update(() => closedState())
	}

	function isActive() {
		return store.value.step !== 'closed'
	}

	return Object.assign(store, {
		open, toRow, backToDice, toFlushDiscard, backToRow, close, isActive,
	})
}
