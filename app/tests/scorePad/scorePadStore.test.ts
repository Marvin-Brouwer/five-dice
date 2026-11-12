import { beforeEach, describe, expect, test } from 'vitest'

import { roundAmount } from '../../src/game/logic/gameConstants.ts'
import { discard, score } from '../../src/game/logic/score/score.ts'
import { createScorePad } from '../../src/game/logic/score/scorePad.ts'
import { createScorePadStore, type ScorePadStore } from '../../src/game/logic/scorePadStore.mts'

const aces = score([1, 1, 2, 3, 4])

describe('createScorePad', () => {

	test('starts with every simple field empty and an empty flush', () => {
		const pad = createScorePad()

		expect(pad.aces).toBeUndefined()
		expect(pad.chance).toBeUndefined()
		expect(pad.flush).toEqual([])
	})

	test('creates independent pads', () => {
		expect(createScorePad()).not.toBe(createScorePad())
	})
})

describe('scorePadStore', () => {

	let sut: ScorePadStore
	beforeEach(() => { sut = createScorePadStore() })

	test('starts at round one without progress', () => {
		expect(sut.value.round).toBe(1)
		expect(sut.hasProgress()).toBe(false)
		expect(sut.canUndo()).toBe(false)
		expect(sut.gameEnded()).toBe(false)
	})

	test('applying a score advances the round and records progress', () => {
		sut.apply({ field: 'aces', score: aces })

		expect(sut.value.round).toBe(2)
		expect(sut.hasProgress()).toBe(true)
		expect(sut.canUndo()).toBe(true)
	})

	test('a discarded score counts as progress', () => {
		sut.apply({ field: 'chance', score: discard() })

		expect(sut.hasProgress()).toBe(true)
	})

	test('undo restores the previous round and can only be used once', () => {
		sut.apply({ field: 'aces', score: aces })
		sut.undo()

		expect(sut.value.round).toBe(1)
		expect(sut.hasProgress()).toBe(false)
		expect(sut.canUndo()).toBe(false)
	})

	test('undo without anything applied does nothing', () => {
		sut.undo()

		expect(sut.value.round).toBe(1)
	})

	test('reset clears progress', () => {
		sut.apply({ field: 'aces', score: aces })
		sut.reset()

		expect(sut.value.round).toBe(1)
		expect(sut.hasProgress()).toBe(false)
		expect(sut.canUndo()).toBe(false)
	})

	test('the game ends after the last round', () => {
		const fields = ['aces', 'deuces', 'threes', 'fours', 'fives', 'sixes', 'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'flush', 'chance'] as const
		for (const field of fields) sut.apply({ field, score: discard() })

		expect(fields).toHaveLength(roundAmount)
		expect(sut.gameEnded()).toBe(true)
	})
})
