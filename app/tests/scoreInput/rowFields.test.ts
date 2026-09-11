import { describe, expect, test } from 'vitest'

import { scoreFieldOrder } from '../../src/game/logic/fields.ts'
import { discard, isDiscarded, score } from '../../src/game/logic/score/score.ts'
import { createScorePad } from '../../src/game/logic/score/scorePad.ts'
import {
	availableRowFields,
	flushDiscardFields,
	flushNeedsDiscard,
} from '../../src/game/score-input/row-fields.mts'

const ones = score([1, 1, 1, 1, 1])
const mixed = score([1, 2, 3, 4, 6])

/**
 * `score()` attaches a fresh `toString` closure to every value, so two
 * equivalent rolls are never `toEqual`. Compare the dice themselves.
 */
const dieValuesOf = (value: unknown) => Array.from(value as ArrayLike<number>)

describe('availableRowFields', () => {

	test('an empty pad offers every field', () => {
		const fields = availableRowFields(createScorePad(), [1, 2, 3, 4, 6])

		expect(fields.map(f => f.field)).toEqual(scoreFieldOrder)
	})

	test('taken fields drop out', () => {
		const pad = createScorePad()
		pad.chance = mixed
		pad.aces = discard()

		const offered = availableRowFields(pad, [1, 2, 3, 4, 6]).map(f => f.field)

		expect(offered).not.toContain('chance')
		expect(offered).not.toContain('aces')
	})

	test('the flush slot stays selectable while it holds entries', () => {
		const pad = createScorePad()
		pad.flush = [ones]

		const offered = availableRowFields(pad, [1, 1, 1, 1, 1]).map(f => f.field)

		expect(offered).toContain('flush')
	})

	test('a discarded flush slot drops out', () => {
		const pad = createScorePad()
		pad.flush = discard()

		const offered = availableRowFields(pad, [1, 1, 1, 1, 1]).map(f => f.field)

		expect(offered).not.toContain('flush')
	})

	test('applicable rows preview the projected cell, others preview a discard', () => {
		const fields = availableRowFields(createScorePad(), [1, 1, 1, 1, 1])

		const aces = fields.find(f => f.field === 'aces')!
		expect(aces.variant).toBe('valid')
		expect(dieValuesOf(aces.previewCell)).toEqual([1, 1, 1, 1, 1])

		const smallStraight = fields.find(f => f.field === 'smallStraight')!
		expect(smallStraight.variant).toBe('discard')
		expect(isDiscarded(smallStraight.previewCell!)).toBe(true)
	})

	test('a second flush previews both entries, so the badge counts them', () => {
		const pad = createScorePad()
		pad.flush = [ones]

		const flush = availableRowFields(pad, [4, 4, 4, 4, 4]).find(f => f.field === 'flush')!

		expect(flush.variant).toBe('valid')
		expect(flush.previewCell).toHaveLength(2)
	})
})

describe('flushDiscardFields', () => {

	test('offers every free field except the flush slot itself', () => {
		const offered = flushDiscardFields(createScorePad()).map(f => f.field)

		expect(offered).not.toContain('flush')
		expect(offered).toEqual(scoreFieldOrder.filter(f => f !== 'flush'))
	})

	test('skips fields that are already filled', () => {
		const pad = createScorePad()
		pad.chance = mixed

		expect(flushDiscardFields(pad).map(f => f.field)).not.toContain('chance')
	})

	test('every offered row is a discard', () => {
		const fields = flushDiscardFields(createScorePad())

		expect(fields.every(f => f.variant === 'discard')).toBe(true)
		expect(fields.every(f => isDiscarded(f.previewCell!))).toBe(true)
	})
})

describe('flushNeedsDiscard', () => {

	test('the first flush costs nothing', () => {
		expect(flushNeedsDiscard(createScorePad())).toBe(false)
	})

	test('a later flush has to sacrifice a row', () => {
		const pad = createScorePad()
		pad.flush = [ones]

		expect(flushNeedsDiscard(pad)).toBe(true)
	})
})
