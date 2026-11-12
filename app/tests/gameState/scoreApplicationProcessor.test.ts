import { describe, expect, test } from 'vitest'

import { discard, score } from '../../src/game/logic/score/score.ts'
import { createScorePad } from '../../src/game/logic/score/scorePad.ts'
import { applyScore } from '../../src/game/logic/score/scoreApplicationProcessor.ts'
import { InvalidScoreApplicationError } from '../../src/game/logic/score/invalidScoreApplicationError.ts'

const aces = score([1, 1, 2, 3, 4])
const flush = score([3, 3, 3, 3, 3])

describe('applyScore', () => {

	test('applies a simple score without mutating the pad', () => {
		const pad = createScorePad()
		const result = applyScore(pad, { field: 'aces', score: aces })
		expect(result.aces).toBe(aces)
		expect(pad.aces).toBeUndefined()
	})

	test('rejects a score that does not fit the field', () => {
		expect(() => applyScore(createScorePad(), { field: 'sixes', score: aces }))
			.toThrow(InvalidScoreApplicationError)
	})

	test('rejects applying to a field twice', () => {
		const pad = applyScore(createScorePad(), { field: 'aces', score: aces })
		expect(() => applyScore(pad, { field: 'aces', score: aces }))
			.toThrow(/already applied/)
	})

	test('a discard can be applied to a field', () => {
		const result = applyScore(createScorePad(), { field: 'chance', score: discard() })
		expect(result.chance).toBe(discard())
	})

	test('first flush is appended without discard', () => {
		const result = applyScore(createScorePad(), { field: 'flush', score: flush })
		expect(result.flush).toEqual([flush])
	})

	test('second flush requires a discard', () => {
		const pad = applyScore(createScorePad(), { field: 'flush', score: flush })
		expect(() => applyScore(pad, { field: 'flush', score: flush }))
			.toThrow(/discard is required/)
	})

	test('second flush discards another field', () => {
		const pad = applyScore(createScorePad(), { field: 'flush', score: flush })
		const result = applyScore(pad, { field: 'flush', score: flush, discard: 'chance' })
		expect(result.flush).toHaveLength(2)
		expect(result.chance).toBe(discard())
	})

	test('second flush cannot discard an already used field', () => {
		let pad = applyScore(createScorePad(), { field: 'flush', score: flush })
		pad = applyScore(pad, { field: 'aces', score: aces })
		expect(() => applyScore(pad, { field: 'flush', score: flush, discard: 'aces' }))
			.toThrow(/already applied/)
	})

	test('an empty flush can be discarded and then locks', () => {
		const pad = applyScore(createScorePad(), { field: 'flush', score: discard() })
		expect(pad.flush).toBe(discard())
		expect(() => applyScore(pad, { field: 'flush', score: flush }))
			.toThrow(/already discarded/)
		expect(() => applyScore(pad, { field: 'flush', score: discard() }))
			.toThrow(/already applied/)
	})

	test('a flush with value cannot be discarded', () => {
		const pad = applyScore(createScorePad(), { field: 'flush', score: flush })
		expect(() => applyScore(pad, { field: 'flush', score: discard() }))
			.toThrow(/already has value/)
	})
})
