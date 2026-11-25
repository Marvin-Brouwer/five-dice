import { describe, expect, test } from 'vitest'

import { createGameContext } from '../../src/game/logic/game-context.mts'
import { scorePadStore } from '../../src/game/logic/scorePadStore.mts'

describe('createGameContext', () => {

	test('shares the app-wide score pad between contexts', () => {
		const first = createGameContext()
		const second = createGameContext()

		expect(first.pad).toBe(scorePadStore)
		expect(second.pad).toBe(scorePadStore)
	})

	test('rebuilds the transient members per context', () => {
		const first = createGameContext()
		const second = createGameContext()

		expect(first.flow).not.toBe(second.flow)
		expect(first.selection).not.toBe(second.selection)
		expect(first.rows).not.toBe(second.rows)
	})
})
