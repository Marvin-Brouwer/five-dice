import { describe, expect, test } from 'vitest'

import { partOneFields, partTwoFields, scoreFieldOrder } from '../../src/game/logic/fields.ts'
import { dice, roundAmount } from '../../src/game/logic/gameConstants.ts'

describe('field lists', () => {

	test('there is one field per round', () => {
		// Arrange
		const sut = scoreFieldOrder

		// Act
		const result = sut.length

		// Assert
		expect(result).toBe(roundAmount)
	})

	test('score card order is part one followed by part two', () => {
		// Arrange
		const sut = scoreFieldOrder

		// Act
		const result = [...partOneFields, ...partTwoFields]

		// Assert
		expect(sut).toEqual(result)
	})

	test('fields are unique', () => {
		// Arrange
		const sut = scoreFieldOrder

		// Act
		const result = new Set(sut)

		// Assert
		expect(result.size).toBe(sut.length)
	})

	test('part one fields map to die values 1 through 6 in order', () => {
		// Arrange
		const sut = partOneFields

		// Act
		const result = sut.map(field => dice[field])

		// Assert
		expect(result).toEqual([1, 2, 3, 4, 5, 6])
	})
})
