import { describe, expect, test } from 'vitest'

import { InvalidScoreError } from '../../src/game/logic/score/invalidScoreError.ts'
import { discard, score } from '../../src/game/logic/score/score.ts'

describe('InvalidScoreError', () => {

	test('normalScoreCannotBeArray names the offending field', () => {
		const container = [score([1, 2, 3, 4, 5])]
		const error = InvalidScoreError.normalScoreCannotBeArray(container, 'aces')

		expect(error).toBeInstanceOf(Error)
		expect(error.message).toContain('\'aces\'')
		expect(error.field).toBe('aces')
		expect(error.score).toBe(container)
	})

	test('flushCannotBeNormalScore always targets the flush field', () => {
		const container = discard()
		const error = InvalidScoreError.flushCannotBeNormalScore(container)

		expect(error.message).toContain('flush')
		expect(error.field).toBe('flush')
		expect(error.score).toBe(container)
	})
})
