import { describe, expect, test } from 'vitest'

import { discard, score } from '../../src/game/logic/score/score.ts'
import { isScoreApplicableToField } from '../../src/game/logic/score/scoreFieldValidator.ts'

describe('isScoreApplicableToField', () => {

	test('a discard fits every field', () => {
		// Arrange
		const sut = discard()

		// Act
		const result = isScoreApplicableToField(sut, 'fullHouse')

		// Assert
		expect(result).toBe(true)
	})

	test('part one fields need the matching die: matching die', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 6])

		// Act
		const result = isScoreApplicableToField(sut, 'aces')

		// Assert
		expect(result).toBe(true)
	})

	test('part one fields need the matching die: missing die', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 6])

		// Act
		const result = isScoreApplicableToField(sut, 'fives')

		// Assert
		expect(result).toBe(false)
	})

	test('three of a kind accepts three equal dice', () => {
		// Arrange
		const sut = score([2, 2, 2, 4, 6])

		// Act
		const result = isScoreApplicableToField(sut, 'threeOfKind')

		// Assert
		expect(result).toBe(true)
	})

	test('four of a kind rejects three equal dice', () => {
		// Arrange
		const sut = score([2, 2, 2, 4, 6])

		// Act
		const result = isScoreApplicableToField(sut, 'fourOfKind')

		// Assert
		expect(result).toBe(false)
	})

	test('four of a kind accepts four equal dice', () => {
		// Arrange
		const sut = score([2, 2, 2, 2, 6])

		// Act
		const result = isScoreApplicableToField(sut, 'fourOfKind')

		// Assert
		expect(result).toBe(true)
	})

	test('full house accepts a pair and three equal dice', () => {
		// Arrange
		const sut = score([2, 2, 3, 3, 3])

		// Act
		const result = isScoreApplicableToField(sut, 'fullHouse')

		// Assert
		expect(result).toBe(true)
	})

	test('full house rejects two pairs', () => {
		// Arrange
		const sut = score([2, 2, 3, 3, 4])

		// Act
		const result = isScoreApplicableToField(sut, 'fullHouse')

		// Assert
		expect(result).toBe(false)
	})

	test('small straight accepts four in a row', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 6])

		// Act
		const result = isScoreApplicableToField(sut, 'smallStraight')

		// Assert
		expect(result).toBe(true)
	})

	test('small straight rejects a gap', () => {
		// Arrange
		const sut = score([1, 2, 3, 5, 6])

		// Act
		const result = isScoreApplicableToField(sut, 'smallStraight')

		// Assert
		expect(result).toBe(false)
	})

	test('large straight accepts five in a row', () => {
		// Arrange
		const sut = score([2, 3, 4, 5, 6])

		// Act
		const result = isScoreApplicableToField(sut, 'largeStraight')

		// Assert
		expect(result).toBe(true)
	})

	test('large straight rejects four in a row', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 6])

		// Act
		const result = isScoreApplicableToField(sut, 'largeStraight')

		// Assert
		expect(result).toBe(false)
	})

	test('flush accepts five equal dice', () => {
		// Arrange
		const sut = score([3, 3, 3, 3, 3])

		// Act
		const result = isScoreApplicableToField(sut, 'flush')

		// Assert
		expect(result).toBe(true)
	})

	test('flush rejects four equal dice', () => {
		// Arrange
		const sut = score([3, 3, 3, 3, 4])

		// Act
		const result = isScoreApplicableToField(sut, 'flush')

		// Assert
		expect(result).toBe(false)
	})

	test('chance accepts anything', () => {
		// Arrange
		const sut = score([1, 2, 3, 5, 6])

		// Act
		const result = isScoreApplicableToField(sut, 'chance')

		// Assert
		expect(result).toBe(true)
	})
})
