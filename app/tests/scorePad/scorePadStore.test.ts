import { beforeEach, describe, expect, test } from 'vitest'

import { roundAmount } from '../../src/game/logic/gameConstants.ts'
import { discard, score } from '../../src/game/logic/score/score.ts'
import { createScorePad } from '../../src/game/logic/score/scorePad.ts'
import { createScorePadStore, type ScorePadStore } from '../../src/game/logic/scorePadStore.mts'

const aces = score([1, 1, 2, 3, 4])

describe('createScorePad', () => {

	test('starts with every simple field empty and an empty flush', () => {
		// Arrange
		const sut = createScorePad

		// Act
		const result = sut()

		// Assert
		expect(result.aces).toBeUndefined()
		expect(result.chance).toBeUndefined()
		expect(result.flush).toEqual([])
	})

	test('creates independent pads', () => {
		// Arrange
		const sut = createScorePad

		// Act
		const result = sut()

		// Assert
		expect(result).not.toBe(sut())
	})
})

describe('scorePadStore', () => {

	let sut: ScorePadStore
	beforeEach(() => { sut = createScorePadStore() })

	test('starts at round one without progress', () => {
		// Arrange

		// Act
		const result = sut

		// Assert
		expect(result.value.round).toBe(1)
		expect(result.hasProgress()).toBe(false)
		expect(result.canUndo()).toBe(false)
		expect(result.gameEnded()).toBe(false)
	})

	test('applying a score advances the round and records progress', () => {
		// Arrange

		// Act
		sut.apply({ field: 'aces', score: aces })

		// Assert
		expect(sut.value.round).toBe(2)
		expect(sut.hasProgress()).toBe(true)
		expect(sut.canUndo()).toBe(true)
	})

	test('a discarded score counts as progress', () => {
		// Arrange

		// Act
		sut.apply({ field: 'chance', score: discard() })

		// Assert
		expect(sut.hasProgress()).toBe(true)
	})

	test('undo restores the previous round and can only be used once', () => {
		// Arrange
		sut.apply({ field: 'aces', score: aces })

		// Act
		sut.undo()

		// Assert
		expect(sut.value.round).toBe(1)
		expect(sut.hasProgress()).toBe(false)
		expect(sut.canUndo()).toBe(false)
	})

	test('undo without anything applied does nothing', () => {
		// Arrange

		// Act
		sut.undo()

		// Assert
		expect(sut.value.round).toBe(1)
	})

	test('reset clears progress', () => {
		// Arrange
		sut.apply({ field: 'aces', score: aces })

		// Act
		sut.reset()

		// Assert
		expect(sut.value.round).toBe(1)
		expect(sut.hasProgress()).toBe(false)
		expect(sut.canUndo()).toBe(false)
	})

	test('the game ends after the last round', () => {
		// Arrange
		const fields = ['aces', 'deuces', 'threes', 'fours', 'fives', 'sixes', 'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'flush', 'chance'] as const

		// Act
		for (const field of fields) sut.apply({ field, score: discard() })

		// Assert
		expect(fields).toHaveLength(roundAmount)
		expect(sut.gameEnded()).toBe(true)
	})
})
