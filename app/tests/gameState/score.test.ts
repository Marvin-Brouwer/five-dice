import { describe, expect, test } from 'vitest'

import { discard, isDiscarded, isFlushScore, score } from '../../src/game/logic/score/score.ts'

describe('score', () => {

	test('a score holds the dice it was created with', () => {
		expect([...score([1, 2, 3, 4, 5])]).toEqual([1, 2, 3, 4, 5])
	})

	test('a score renders as its dice', () => {
		expect(score([6, 6, 1, 1, 2]).toString()).toBe('[ 6 6 1 1 2 ]')
	})

	test('a discarded score renders as a slash', () => {
		expect(discard().toString()).toBe('/')
	})

	test('discard always returns the same instance', () => {
		expect(discard()).toBe(discard())
	})
})

describe('isDiscarded', () => {

	test('is true for a discarded score', () => {
		expect(isDiscarded(discard())).toBe(true)
	})

	test('is false for a valid score', () => {
		expect(isDiscarded(score([1, 1, 1, 1, 1]))).toBe(false)
	})

	test('is false for a flush array', () => {
		expect(isDiscarded([score([2, 2, 2, 2, 2])])).toBe(false)
	})
})

describe('isFlushScore', () => {

	test('is true for an array of scores', () => {
		expect(isFlushScore([score([2, 2, 2, 2, 2])])).toBe(true)
	})

	test('is true for an empty flush', () => {
		expect(isFlushScore([])).toBe(true)
	})

	test('is false for a single valid score', () => {
		expect(isFlushScore(score([1, 2, 3, 4, 5]))).toBe(false)
	})

	test('is false for a discarded score', () => {
		expect(isFlushScore(discard())).toBe(false)
	})
})
