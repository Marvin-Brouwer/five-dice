import { createStore, type Store } from '@rooted/store'

import type { DiceTuple, DieValue } from '../logic/gameConstants.ts'

export const dieValues: DieValue[] = [1, 2, 3, 4, 5, 6]
export const slotCount = 5
export const slotIndices = [0, 1, 2, 3, 4] as const

export type InputDice = Array<DieValue | undefined>

export type DiceState = {
	dice: InputDice
	/**
	 * The slot the next keypress fills, or undefined when the roll is
	 * complete and no slot should carry the accent border.
	 */
	focusedDie: number | undefined
}

export type DiceStore = Store<DiceState> & {
	fill(value: DieValue): void
	clearSlot(index: number): void
	focusSlot(index: number): void
	/** Move focus by `delta` slots, wrapping at both ends. */
	moveFocus(delta: number): void
	reset(carry?: DiceTuple): void
	asTuple(): DiceTuple | undefined
	remaining(): number
}

function emptyDice(): InputDice {
	return Array.from({ length: slotCount }, () => undefined)
}

function firstEmpty(dice: InputDice): number | undefined {
	const index = dice.findIndex(die => die === undefined)
	return index === -1 ? undefined : index
}

function nextEmpty(dice: InputDice, after: number): number | undefined {
	for (let step = 1; step <= dice.length; step++) {
		const index = (after + step) % dice.length
		if (dice[index] === undefined) return index
	}
	return undefined
}

function toTuple(dice: InputDice): DiceTuple | undefined {
	if (dice.length !== slotCount) return undefined
	if (dice.some(die => die === undefined)) return undefined
	return dice.slice(0, slotCount) as DiceTuple
}

/**
 * The five dice being entered, plus which slot is next.
 *
 * Commands rather than raw writes, so the slots, the keypad and the action
 * bar can each own a piece of the modal without reaching into one another.
 * Focus is state here; moving actual DOM focus is the slots' job, reconciled
 * from `focusedDie`.
 */
export function createDiceStore(): DiceStore {
	const store = createStore<DiceState>({ dice: emptyDice(), focusedDie: 0 })

	function fill(value: DieValue) {
		store.update(state => {
			const index = state.focusedDie
			// No focused slot means the roll is already complete.
			if (index === undefined) return
			state.dice[index] = value
			state.focusedDie = nextEmpty(state.dice, index)
		})
	}

	function clearSlot(index: number) {
		store.update(state => {
			state.dice[index] = undefined
			state.focusedDie = index
		})
	}

	function focusSlot(index: number) {
		store.update(state => { state.focusedDie = index })
	}

	function moveFocus(delta: number) {
		store.update(state => {
			const from = state.focusedDie ?? 0
			state.focusedDie = (from + delta + slotCount) % slotCount
		})
	}

	function reset(carry?: DiceTuple) {
		store.update(() => {
			const dice: InputDice = carry ? Array.from(carry) : emptyDice()
			return { dice, focusedDie: firstEmpty(dice) }
		})
	}

	function asTuple() {
		return toTuple(store.value.dice as InputDice)
	}

	function remaining() {
		return store.value.dice.filter(die => die === undefined).length
	}

	return Object.assign(store, { fill, clearSlot, focusSlot, moveFocus, reset, asTuple, remaining })
}
