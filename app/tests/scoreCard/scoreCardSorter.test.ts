import { describe, expect, test } from 'vitest'

import type { DieValue } from '../../src/game/logic/gameConstants.ts'
import {
	sortFullHouse,
	sortSimpleScore,
	sortSomeOfKind,
	sortStraight,
} from '../../src/game/score-card/score-card.sorter.ts'

const dice = (...values: Array<number>) => values as Array<DieValue>

describe('score-card sorter', () => {

	test('simple score puts the counted value in the large group', () => {
		// Arrange
		const input = dice(3, 5, 3, 1, 5)

		// Act
		const result = sortSimpleScore(3, input)

		// Assert
		expect(result).toEqual([[1, 5, 5], [3, 3]])
	})

	test('simple score without matches has an empty large group', () => {
		// Arrange
		const input = dice(1, 2, 3, 4, 5)

		// Act
		const result = sortSimpleScore(6, input)

		// Assert
		expect(result).toEqual([[1, 2, 3, 4, 5], []])
	})

	test('three of a kind splits the remaining two dice off', () => {
		// Arrange
		const input = dice(4, 2, 4, 6, 4)

		// Act
		const result = sortSomeOfKind(3, input)

		// Assert
		expect(result).toEqual([[2, 6], [4, 4, 4]])
	})

	test('four of a kind splits one die off', () => {
		// Arrange
		const input = dice(2, 5, 5, 5, 5)

		// Act
		const result = sortSomeOfKind(4, input)

		// Assert
		expect(result).toEqual([[2], [5, 5, 5, 5]])
	})

	test('full house puts the pair in the small group', () => {
		// Arrange
		const input = dice(3, 3, 5, 5, 5)

		// Act
		const result = sortFullHouse(input)

		// Assert
		expect(result).toEqual([[3, 3], [5, 5, 5]])
	})

	test('straight lists unique values large and duplicates small', () => {
		// Arrange
		const input = dice(4, 1, 2, 3, 2)

		// Act
		const result = sortStraight(input)

		// Assert
		expect(result).toEqual([[2], [1, 2, 3, 4]])
	})
})
