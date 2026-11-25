import { describe, expect, test } from 'vitest'

import { createGameContext } from '../../src/game/logic/game-context.mts'
import { scorePadStore } from '../../src/game/logic/scorePadStore.mts'

describe('createGameContext', () => {

	test('shares the app-wide score pad between contexts', () => {
		// Arrange
		const sut = createGameContext

		// Act
		const result = [sut(), sut()]

		// Assert
		expect(result[0].pad).toBe(scorePadStore)
		expect(result[1].pad).toBe(scorePadStore)
	})

	test('rebuilds the transient members per context', () => {
		// Arrange
		const sut = createGameContext

		// Act
		const [first, second] = [sut(), sut()]

		// Assert
		expect(first.flow).not.toBe(second.flow)
		expect(first.selection).not.toBe(second.selection)
		expect(first.rows).not.toBe(second.rows)
	})
})
