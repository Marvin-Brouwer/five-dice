import { describe, expect, test } from 'vitest'

import { partOneFields, partTwoFields, scoreFieldOrder } from '../../src/game/logic/fields.ts'
import { dice, roundAmount } from '../../src/game/logic/gameConstants.ts'

describe('field lists', () => {

	test('there is one field per round', () => {
		expect(scoreFieldOrder).toHaveLength(roundAmount)
	})

	test('score card order is part one followed by part two', () => {
		expect(scoreFieldOrder).toEqual([...partOneFields, ...partTwoFields])
	})

	test('fields are unique', () => {
		expect(new Set(scoreFieldOrder).size).toBe(scoreFieldOrder.length)
	})

	test('part one fields map to die values 1 through 6 in order', () => {
		expect(partOneFields.map(field => dice[field])).toEqual([1, 2, 3, 4, 5, 6])
	})
})
