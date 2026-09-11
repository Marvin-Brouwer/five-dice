import { expect, test } from '@playwright/test'

import type { DiceTuple, DieValue, ScoreField } from '../src/game/logic/gameConstants.ts'

import { GamePage } from './game-page.mts'

/**
 * Thirteen flushes, every one of them committed to the flush row.
 *
 * The first takes the slot outright for 50; the other twelve stack +100 each
 * and must each sacrifice another row — which happens to consume exactly the
 * twelve non-flush fields, so the pad finishes full on round 13 with only one
 * option left in the discard picker.
 */
const sacrifices: ScoreField[] = [
	'aces', 'deuces', 'threes', 'fours', 'fives', 'sixes',
	'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'chance',
]

/** Cycle 1-6 so consecutive rounds are visually distinct. */
function flushFor(round: number): DiceTuple {
	const value = ((round - 1) % 6 + 1) as DieValue
	return [value, value, value, value, value]
}

const rounds = sacrifices.length + 1
const expectedFinal = String(50 + (rounds - 1) * 100)

test('thirteen flushes stacked onto the flush row', async ({ page }) => {
	const game = new GamePage(page)
	await game.goto()

	for (let round = 1; round <= rounds; round++) {
		// Round 1 takes the empty flush slot; every later one has to pay for it.
		const sacrifice = round === 1 ? undefined : sacrifices[round - 2]
		await game.enterRoll(flushFor(round), 'flush', sacrifice)

		const flush = await game.row('flush')
		expect(flush.score, `flush after ${round} flush(es)`).toBe(String(50 + (round - 1) * 100))
		expect(flush.badge, `badge after ${round} flush(es)`).toBe(round === 1 ? null : `+${round - 1}`)
		expect(flush.dice, 'the flush row shows the latest roll').toBe(5)

		if (sacrifice !== undefined) {
			const given = await game.row(sacrifice)
			expect(given.discarded, `${sacrifice} was sacrificed`).toBe(true)
			expect(given.score, `${sacrifice} scores nothing`).toBe('')
		}
	}

	for (const field of sacrifices) {
		expect((await game.row(field)).discarded, `${field} ended discarded`).toBe(true)
	}

	expect(await game.totals()).toEqual({
		partOne: '.',
		bonus: '.',
		partTwo: expectedFinal,
		final: expectedFinal,
	})

	await game.expectFinished()

	// Let the celebration finish before the test ends, so the recorded video
	// includes it and the frame count has settled.
	await game.waitForCelebrationToEnd()
	await game.expectCelebrated()
})
