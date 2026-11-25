import { describe, expect, test } from 'vitest'

import { InvalidScoreError } from '../../src/game/logic/score/invalidScoreError.ts'
import { discard, score } from '../../src/game/logic/score/score.ts'

describe('InvalidScoreError', () => {

	test('normalScoreCannotBeArray names the offending field', () => {
		// Arrange
		const container = [score([1, 2, 3, 4, 5])]
		const sut = InvalidScoreError.normalScoreCannotBeArray

		// Act
		const result = sut(container, 'aces')

		// Assert
		expect(result).toBeInstanceOf(Error)
		expect(result.message).toContain('\'aces\'')
		expect(result.field).toBe('aces')
		expect(result.score).toBe(container)
	})

	test('flushCannotBeNormalScore always targets the flush field', () => {
		// Arrange
		const container = discard()
		const sut = InvalidScoreError.flushCannotBeNormalScore

		// Act
		const result = sut(container)

		// Assert
		expect(result.message).toContain('flush')
		expect(result.field).toBe('flush')
		expect(result.score).toBe(container)
	})
})
