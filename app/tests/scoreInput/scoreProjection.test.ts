import { describe, expect, test } from 'vitest'

import { discard, score } from '../../src/game/logic/score/score.ts'
import { createScorePad } from '../../src/game/logic/score/scorePad.ts'
import { flushEntries, projectedCell } from '../../src/game/logic/score/scoreProjection.ts'

const ones = score([1, 1, 1, 1, 1])
const fours = score([4, 4, 4, 4, 4])

describe('flushEntries', () => {

	test('an untouched flush slot has no entries', () => {
		expect(flushEntries(createScorePad())).toHaveLength(0)
	})

	test('a discarded flush slot has no entries', () => {
		const pad = createScorePad()
		pad.flush = discard()

		expect(flushEntries(pad)).toHaveLength(0)
	})

	test('committed flushes are returned in order', () => {
		const pad = createScorePad()
		pad.flush = [ones, fours]

		expect(flushEntries(pad)).toEqual([ones, fours])
	})
})

describe('projectedCell', () => {

	test('a normal field simply takes the roll', () => {
		expect(projectedCell(createScorePad(), 'chance', ones)).toBe(ones)
	})

	test('a first flush becomes a single-entry array', () => {
		expect(projectedCell(createScorePad(), 'flush', ones)).toEqual([ones])
	})

	test('a later flush appends rather than replaces', () => {
		const pad = createScorePad()
		pad.flush = [ones]

		expect(projectedCell(pad, 'flush', fours)).toEqual([ones, fours])
	})

	test('a flush after a discarded slot starts over', () => {
		const pad = createScorePad()
		pad.flush = discard()

		expect(projectedCell(pad, 'flush', fours)).toEqual([fours])
	})
})
