import { beforeEach, describe, expect, test } from 'vitest'

import type { DiceTuple } from '../../src/game/logic/gameConstants.ts'
import { createDiceStore, type DiceStore } from '../../src/game/score-input/dice-state.mts'

const full: DiceTuple = [1, 2, 3, 4, 5]

describe('diceState', () => {

	let state: DiceStore
	beforeEach(() => { state = createDiceStore() })

	test('starts empty with the first slot focused', () => {
		expect(state.value.focusedDie).toBe(0)
		expect(state.remaining()).toBe(5)
		expect(state.asTuple()).toBeUndefined()
	})

	test('filling advances to the next empty slot', () => {
		state.fill(6)

		expect(state.value.dice[0]).toBe(6)
		expect(state.value.focusedDie).toBe(1)
		expect(state.remaining()).toBe(4)
	})

	test('a complete roll leaves no slot focused', () => {
		for (const die of full) state.fill(die)

		expect(state.asTuple()).toEqual(full)
		expect(state.value.focusedDie).toBeUndefined()
	})

	test('filling with no focused slot is a no-op, not a lost write', () => {
		for (const die of full) state.fill(die)
		state.fill(6)

		// Regression: the old -1 sentinel wrote dice[-1], which asTuple
		// silently dropped, leaving the user unable to type.
		expect(state.asTuple()).toEqual(full)
		expect(state.value.dice).toHaveLength(5)
	})

	test('clearing a slot focuses it', () => {
		for (const die of full) state.fill(die)
		state.clearSlot(2)

		expect(state.value.dice[2]).toBeUndefined()
		expect(state.value.focusedDie).toBe(2)
		expect(state.asTuple()).toBeUndefined()
	})

	test('focus wraps at both ends', () => {
		state.focusSlot(4)
		state.moveFocus(1)
		expect(state.value.focusedDie).toBe(0)

		state.moveFocus(-1)
		expect(state.value.focusedDie).toBe(4)
	})

	test('moving focus from a complete roll starts at the first slot', () => {
		for (const die of full) state.fill(die)
		state.moveFocus(1)

		expect(state.value.focusedDie).toBe(1)
	})

	test('reset clears everything', () => {
		for (const die of full) state.fill(die)
		state.reset()

		expect(state.remaining()).toBe(5)
		expect(state.value.focusedDie).toBe(0)
	})

	test('reset with a carried roll repopulates it and focuses nothing', () => {
		state.reset(full)

		expect(state.asTuple()).toEqual(full)
		expect(state.value.focusedDie).toBeUndefined()
	})
})
