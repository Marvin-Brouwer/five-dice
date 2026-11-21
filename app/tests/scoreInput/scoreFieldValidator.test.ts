import { describe, expect, test } from 'vitest'

import { discard, score } from '../../src/game/logic/score/score.ts'
import { isScoreApplicableToField } from '../../src/game/logic/score/scoreFieldValidator.ts'

describe('isScoreApplicableToField', () => {

	test('a discard fits every field', () => {
		expect(isScoreApplicableToField(discard(), 'fullHouse')).toBe(true)
	})

	test('part one fields need the matching die', () => {
		expect(isScoreApplicableToField(score([1, 2, 3, 4, 6]), 'aces')).toBe(true)
		expect(isScoreApplicableToField(score([1, 2, 3, 4, 6]), 'fives')).toBe(false)
	})

	test('of a kind', () => {
		expect(isScoreApplicableToField(score([2, 2, 2, 4, 6]), 'threeOfKind')).toBe(true)
		expect(isScoreApplicableToField(score([2, 2, 2, 4, 6]), 'fourOfKind')).toBe(false)
		expect(isScoreApplicableToField(score([2, 2, 2, 2, 6]), 'fourOfKind')).toBe(true)
	})

	test('full house', () => {
		expect(isScoreApplicableToField(score([2, 2, 3, 3, 3]), 'fullHouse')).toBe(true)
		expect(isScoreApplicableToField(score([2, 2, 3, 3, 4]), 'fullHouse')).toBe(false)
	})

	test('straights', () => {
		expect(isScoreApplicableToField(score([1, 2, 3, 4, 6]), 'smallStraight')).toBe(true)
		expect(isScoreApplicableToField(score([1, 2, 3, 5, 6]), 'smallStraight')).toBe(false)
		expect(isScoreApplicableToField(score([2, 3, 4, 5, 6]), 'largeStraight')).toBe(true)
		expect(isScoreApplicableToField(score([1, 2, 3, 4, 6]), 'largeStraight')).toBe(false)
	})

	test('flush and chance', () => {
		expect(isScoreApplicableToField(score([3, 3, 3, 3, 3]), 'flush')).toBe(true)
		expect(isScoreApplicableToField(score([3, 3, 3, 3, 4]), 'flush')).toBe(false)
		expect(isScoreApplicableToField(score([1, 2, 3, 5, 6]), 'chance')).toBe(true)
	})
})
