import { describe, expect, test } from 'vitest'

import { discard, score } from '../../src/game/logic/score/score.ts'
import { createScorePad } from '../../src/game/logic/score/scorePad.ts'
import {
	calculateFlush,
	calculateGameTotal,
	calculatePartOneBonus,
	calculatePartOneSubTotal,
	calculatePartTwoTotal,
	calculateScore,
	calculateScoreForPad,
	hasPartOneBonus,
} from '../../src/game/logic/score/scoreCalculator.ts'

describe('scoreCalculator', () => {

	test('an empty field scores zero', () => {
		// Arrange
		const sut = createScorePad()

		// Act
		const result = calculateScoreForPad(sut, 'aces')

		// Assert
		expect(result).toBe(0)
	})

	test('an empty flush scores zero', () => {
		// Arrange
		const sut = createScorePad()

		// Act
		const result = calculateScoreForPad(sut, 'flush')

		// Assert
		expect(result).toBe(0)
	})

	test('a discarded field scores zero', () => {
		// Arrange
		const sut = createScorePad()
		sut.chance = discard()

		// Act
		const result = calculateScoreForPad(sut, 'chance')

		// Assert
		expect(result).toBe(0)
	})

	test('part one fields count matching dice', () => {
		// Arrange
		const sut = score([1, 1, 2, 3, 1])

		// Act
		const result = calculateScore(sut, 'aces')

		// Assert
		expect(result).toBe(3)
	})

	test('part one fields multiply matching dice by their value', () => {
		// Arrange
		const sut = score([6, 6, 2, 3, 6])

		// Act
		const result = calculateScore(sut, 'sixes')

		// Assert
		expect(result).toBe(18)
	})

	test('part one fields ignore non-matching dice', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 5])

		// Act
		const result = calculateScore(sut, 'sixes')

		// Assert
		expect(result).toBe(0)
	})

	test('threeOfKind: sum fields add all dice', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 6])

		// Act
		const result = calculateScore(sut, 'threeOfKind')

		// Assert
		expect(result).toBe(16)
	})

	test('fourOfKind: sum fields add all dice', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 6])

		// Act
		const result = calculateScore(sut, 'fourOfKind')

		// Assert
		expect(result).toBe(16)
	})

	test('chance: sum fields add all dice', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 6])

		// Act
		const result = calculateScore(sut, 'chance')

		// Assert
		expect(result).toBe(16)
	})

	test('fullHouse: fixed fields score fixed values', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 6])

		// Act
		const result = calculateScore(sut, 'fullHouse')

		// Assert
		expect(result).toBe(25)
	})

	test('smallStraight: fixed fields score fixed values', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 6])

		// Act
		const result = calculateScore(sut, 'smallStraight')

		// Assert
		expect(result).toBe(30)
	})

	test('largeStraight: fixed fields score fixed values', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 6])

		// Act
		const result = calculateScore(sut, 'largeStraight')

		// Assert
		expect(result).toBe(40)
	})

	test('flush scores 0 for 0 entries', () => {
		// Arrange
		const yahtzee = score([3, 3, 3, 3, 3])
		const sut = []

		// Act
		const result = calculateFlush(sut)

		// Assert
		expect(result).toBe(0)
	})

	test('flush scores 50 for 1 entries', () => {
		// Arrange
		const yahtzee = score([3, 3, 3, 3, 3])
		const sut = [yahtzee]

		// Act
		const result = calculateFlush(sut)

		// Assert
		expect(result).toBe(50)
	})

	test('flush scores 150 for 2 entries', () => {
		// Arrange
		const yahtzee = score([3, 3, 3, 3, 3])
		const sut = [yahtzee, yahtzee]

		// Act
		const result = calculateFlush(sut)

		// Assert
		expect(result).toBe(150)
	})

	test('flush scores 250 for 3 entries', () => {
		// Arrange
		const yahtzee = score([3, 3, 3, 3, 3])
		const sut = [yahtzee, yahtzee, yahtzee]

		// Act
		const result = calculateFlush(sut)

		// Assert
		expect(result).toBe(250)
	})

	test('a discarded flush scores zero', () => {
		// Arrange
		const sut = createScorePad()
		sut.flush = discard()

		// Act
		const result = calculateScoreForPad(sut, 'flush')

		// Assert
		expect(result).toBe(0)
	})

	test('part one bonus at 62: has bonus is false', () => {
		// Arrange
		const sut = 62

		// Act
		const result = hasPartOneBonus(sut)

		// Assert
		expect(result).toBe(false)
	})

	test('part one bonus at 62 is worth 0', () => {
		// Arrange
		const sut = 62

		// Act
		const result = calculatePartOneBonus(sut)

		// Assert
		expect(result).toBe(0)
	})

	test('part one bonus at 63: has bonus is true', () => {
		// Arrange
		const sut = 63

		// Act
		const result = hasPartOneBonus(sut)

		// Assert
		expect(result).toBe(true)
	})

	test('part one bonus at 63 is worth 35', () => {
		// Arrange
		const sut = 63

		// Act
		const result = calculatePartOneBonus(sut)

		// Assert
		expect(result).toBe(35)
	})

	test('pad part one subtotal aggregates part one fields', () => {
		// Arrange
		const sut = createScorePad()
		sut.aces = score([1, 1, 1, 2, 3])
		sut.sixes = score([6, 6, 1, 2, 3])
		sut.fullHouse = score([2, 2, 3, 3, 3])
		sut.chance = score([1, 1, 1, 1, 1])
		sut.largeStraight = discard()
		sut.flush = [score([4, 4, 4, 4, 4])]

		// Act
		const result = calculatePartOneSubTotal(sut)

		// Assert
		expect(result).toBe(15)
	})

	test('pad part two total aggregates part two fields', () => {
		// Arrange
		const sut = createScorePad()
		sut.aces = score([1, 1, 1, 2, 3])
		sut.sixes = score([6, 6, 1, 2, 3])
		sut.fullHouse = score([2, 2, 3, 3, 3])
		sut.chance = score([1, 1, 1, 1, 1])
		sut.largeStraight = discard()
		sut.flush = [score([4, 4, 4, 4, 4])]

		// Act
		const result = calculatePartTwoTotal(sut)

		// Assert
		expect(result).toBe(25 + 5 + 50)
	})

	test('game total adds all parts without bonus', () => {
		// Arrange

		// Act
		const result = calculateGameTotal(15, 0, 80)

		// Assert
		expect(result).toBe(95)
	})

	test('game total adds all parts with bonus', () => {
		// Arrange

		// Act
		const result = calculateGameTotal(70, 35, 10)

		// Assert
		expect(result).toBe(115)
	})
})

describe('scoreCalculator edge cases', () => {

	test('an empty flush is worth nothing', () => {
		// Arrange
		const sut: Array<ReturnType<typeof score>> = []

		// Act
		const result = calculateFlush(sut)

		// Assert
		expect(result).toBe(0)
	})

	test('flush is worth 50 for 1 entries', () => {
		// Arrange
		const f = score([3, 3, 3, 3, 3])
		const sut = [f]

		// Act
		const result = calculateFlush(sut)

		// Assert
		expect(result).toBe(50)
	})

	test('flush is worth 150 for 2 entries', () => {
		// Arrange
		const f = score([3, 3, 3, 3, 3])
		const sut = [f, f]

		// Act
		const result = calculateFlush(sut)

		// Assert
		expect(result).toBe(150)
	})

	test('flush is worth 250 for 3 entries', () => {
		// Arrange
		const f = score([3, 3, 3, 3, 3])
		const sut = [f, f, f]

		// Act
		const result = calculateFlush(sut)

		// Assert
		expect(result).toBe(250)
	})

	test('the part one bonus at 62 is absent', () => {
		// Arrange
		const sut = 62

		// Act
		const result = [hasPartOneBonus(sut), calculatePartOneBonus(sut)]

		// Assert
		expect(result).toEqual([false, 0])
	})

	test('the part one bonus at 63 is granted', () => {
		// Arrange
		const sut = 63

		// Act
		const result = [hasPartOneBonus(sut), calculatePartOneBonus(sut)]

		// Assert
		expect(result).toEqual([true, 35])
	})

	test('an empty pad scores nothing', () => {
		// Arrange
		const sut = createScorePad()

		// Act
		const result = calculatePartOneSubTotal(sut)

		// Assert
		expect(result).toBe(0)
	})
})
