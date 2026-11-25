import { describe, expect, test } from 'vitest'

import { discard, isDiscarded, isFlushScore, score } from '../../src/game/logic/score/score.ts'

describe('score', () => {

	test('a score holds the dice it was created with', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 5])

		// Act
		const result = [...sut]

		// Assert
		expect(result).toEqual([1, 2, 3, 4, 5])
	})

	test('a score renders as its dice', () => {
		// Arrange
		const sut = score([6, 6, 1, 1, 2])

		// Act
		const result = sut.toString()

		// Assert
		expect(result).toBe('[ 6 6 1 1 2 ]')
	})

	test('a discarded score renders as a slash', () => {
		// Arrange
		const sut = discard()

		// Act
		const result = sut.toString()

		// Assert
		expect(result).toBe('/')
	})

	test('discard always returns the same instance', () => {
		// Arrange
		const sut = discard

		// Act
		const result = sut()

		// Assert
		expect(result).toBe(sut())
	})
})

describe('isDiscarded', () => {

	test('is true for a discarded score', () => {
		// Arrange
		const sut = discard()

		// Act
		const result = isDiscarded(sut)

		// Assert
		expect(result).toBe(true)
	})

	test('is false for a valid score', () => {
		// Arrange
		const sut = score([1, 1, 1, 1, 1])

		// Act
		const result = isDiscarded(sut)

		// Assert
		expect(result).toBe(false)
	})

	test('is false for a flush array', () => {
		// Arrange
		const sut = [score([2, 2, 2, 2, 2])]

		// Act
		const result = isDiscarded(sut)

		// Assert
		expect(result).toBe(false)
	})
})

describe('isFlushScore', () => {

	test('is true for an array of scores', () => {
		// Arrange
		const sut = [score([2, 2, 2, 2, 2])]

		// Act
		const result = isFlushScore(sut)

		// Assert
		expect(result).toBe(true)
	})

	test('is true for an empty flush', () => {
		// Arrange
		const sut = []

		// Act
		const result = isFlushScore(sut)

		// Assert
		expect(result).toBe(true)
	})

	test('is false for a single valid score', () => {
		// Arrange
		const sut = score([1, 2, 3, 4, 5])

		// Act
		const result = isFlushScore(sut)

		// Assert
		expect(result).toBe(false)
	})

	test('is false for a discarded score', () => {
		// Arrange
		const sut = discard()

		// Act
		const result = isFlushScore(sut)

		// Assert
		expect(result).toBe(false)
	})
})
