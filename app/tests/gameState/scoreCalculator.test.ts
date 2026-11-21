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

	test('an empty or discarded field scores zero', () => {
		const pad = createScorePad()
		expect(calculateScoreForPad(pad, 'aces')).toBe(0)
		expect(calculateScoreForPad(pad, 'flush')).toBe(0)

		pad.chance = discard()
		expect(calculateScoreForPad(pad, 'chance')).toBe(0)
	})

	test('part one fields only count matching dice', () => {
		expect(calculateScore(score([1, 1, 2, 3, 1]), 'aces')).toBe(3)
		expect(calculateScore(score([6, 6, 2, 3, 6]), 'sixes')).toBe(18)
		expect(calculateScore(score([1, 2, 3, 4, 5]), 'sixes')).toBe(0)
	})

	test('sum fields add all dice, fixed fields score fixed values', () => {
		const roll = score([1, 2, 3, 4, 6])
		expect(calculateScore(roll, 'threeOfKind')).toBe(16)
		expect(calculateScore(roll, 'fourOfKind')).toBe(16)
		expect(calculateScore(roll, 'chance')).toBe(16)
		expect(calculateScore(roll, 'fullHouse')).toBe(25)
		expect(calculateScore(roll, 'smallStraight')).toBe(30)
		expect(calculateScore(roll, 'largeStraight')).toBe(40)
	})

	test('flush scores 50 for the first and 100 for each additional', () => {
		const yahtzee = score([3, 3, 3, 3, 3])
		expect(calculateFlush([])).toBe(0)
		expect(calculateFlush([yahtzee])).toBe(50)
		expect(calculateFlush([yahtzee, yahtzee])).toBe(150)
		expect(calculateFlush([yahtzee, yahtzee, yahtzee])).toBe(250)
	})

	test('a discarded flush scores zero', () => {
		const pad = createScorePad()
		pad.flush = discard()
		expect(calculateScoreForPad(pad, 'flush')).toBe(0)
	})

	test('part one bonus starts at 63', () => {
		expect(hasPartOneBonus(62)).toBe(false)
		expect(hasPartOneBonus(63)).toBe(true)
		expect(calculatePartOneBonus(62)).toBe(0)
		expect(calculatePartOneBonus(63)).toBe(35)
	})

	test('pad totals aggregate all fields', () => {
		const pad = createScorePad()
		pad.aces = score([1, 1, 1, 2, 3])
		pad.sixes = score([6, 6, 1, 2, 3])
		pad.fullHouse = score([2, 2, 3, 3, 3])
		pad.chance = score([1, 1, 1, 1, 1])
		pad.largeStraight = discard()
		pad.flush = [score([4, 4, 4, 4, 4])]

		const partOne = calculatePartOneSubTotal(pad)
		const partTwo = calculatePartTwoTotal(pad)

		expect(partOne).toBe(15)
		expect(partTwo).toBe(25 + 5 + 50)
		expect(calculateGameTotal(partOne, 0, partTwo)).toBe(95)
		expect(calculateGameTotal(70, 35, 10)).toBe(115)
	})
})

describe('scoreCalculator edge cases', () => {

	test('an empty flush is worth nothing', () => {
		expect(calculateFlush([])).toBe(0)
	})

	test('flush scores 50, 150 and 250 for one, two and three entries', () => {
		const f = score([3, 3, 3, 3, 3])

		expect(calculateFlush([f])).toBe(50)
		expect(calculateFlush([f, f])).toBe(150)
		expect(calculateFlush([f, f, f])).toBe(250)
	})

	test('the part one bonus starts at exactly 63', () => {
		expect(hasPartOneBonus(62)).toBe(false)
		expect(hasPartOneBonus(63)).toBe(true)
		expect(calculatePartOneBonus(62)).toBe(0)
		expect(calculatePartOneBonus(63)).toBe(35)
	})

	test('an empty pad scores nothing', () => {
		expect(calculatePartOneSubTotal(createScorePad())).toBe(0)
	})
})
