import { describe, expect, test } from 'vitest'

import { discard, score } from '../../src/game/logic/score/score.ts'
import { createScorePad } from '../../src/game/logic/score/scorePad.ts'
import { applyScore } from '../../src/game/logic/score/scoreApplicationProcessor.ts'
import { InvalidScoreApplicationError } from '../../src/game/logic/score/invalidScoreApplicationError.ts'

const aces = score([1, 1, 2, 3, 4])
const flush = score([3, 3, 3, 3, 3])

describe('applyScore', () => {

	test('applies a simple score without mutating the pad', () => {

		// Arrange
		const pad = createScorePad()

		// Act
		const result = applyScore(pad, { field: 'aces', score: aces })

		// Assert
		expect(result.aces).toBe(aces)
		expect(pad.aces).toBeUndefined()
	})

	test('rejects a score that does not fit the field', () => {

		// Arrange
		const pad = createScorePad()
		const sut = () => applyScore(pad, { field: 'sixes', score: aces })

		// Act
		const act = sut

		// Assert
		expect(act).toThrow(InvalidScoreApplicationError)
	})

	test('rejects applying to a field twice', () => {

		// Arrange
		const pad = applyScore(createScorePad(), { field: 'aces', score: aces })
		const sut = () => applyScore(pad, { field: 'aces', score: aces })

		// Act
		const act = sut

		// Assert
		expect(act).toThrow(/already applied/)
	})

	test('a discard can be applied to a field', () => {

		// Arrange
		const pad = createScorePad()

		// Act
		const result = applyScore(pad, { field: 'chance', score: discard() })

		// Assert
		expect(result.chance).toBe(discard())
	})

	test('first flush is appended without discard', () => {

		// Arrange
		const pad = createScorePad()

		// Act
		const result = applyScore(pad, { field: 'flush', score: flush })

		// Assert
		expect(result.flush).toEqual([flush])
	})

	test('second flush requires a discard', () => {

		// Arrange
		const pad = applyScore(createScorePad(), { field: 'flush', score: flush })
		const sut = () => applyScore(pad, { field: 'flush', score: flush })

		// Act
		const act = sut

		// Assert
		expect(act).toThrow(/discard is required/)
	})

	test('second flush discards another field', () => {

		// Arrange
		const pad = applyScore(createScorePad(), { field: 'flush', score: flush })

		// Act
		const result = applyScore(pad, { field: 'flush', score: flush, discard: 'chance' })

		// Assert
		expect(result.flush).toHaveLength(2)
		expect(result.chance).toBe(discard())
	})

	test('second flush cannot discard an already used field', () => {

		// Arrange
		let pad = applyScore(createScorePad(), { field: 'flush', score: flush })
		pad = applyScore(pad, { field: 'aces', score: aces })
		const sut = () => applyScore(pad, { field: 'flush', score: flush, discard: 'aces' })

		// Act
		const act = sut

		// Assert
		expect(act).toThrow(/already applied/)
	})

	test('an empty flush can be discarded and then locks', () => {

		// Arrange
		const pad = applyScore(createScorePad(), { field: 'flush', score: discard() })
		const applyFlush = () => applyScore(pad, { field: 'flush', score: flush })
		const applyDiscard = () => applyScore(pad, { field: 'flush', score: discard() })

		// Act
		const flushAct = applyFlush
		const discardAct = applyDiscard

		// Assert
		expect(pad.flush).toBe(discard())
		expect(flushAct).toThrow(/already discarded/)
		expect(discardAct).toThrow(/already applied/)
	})

	test('a flush with value cannot be discarded', () => {

		// Arrange
		const pad = applyScore(createScorePad(), { field: 'flush', score: flush })
		const sut = () => applyScore(pad, { field: 'flush', score: discard() })

		// Act
		const act = sut

		// Assert
		expect(act).toThrow(/already has value/)
	})
})
