import { expect, test } from '@playwright/test'

import type { DiceTuple, ScoreField } from '../src/game/_logic/gameConstants.ts'

import { GamePage } from './game-page.mts'

type Round = {
	field: ScoreField
	dice: DiceTuple
	/** What the row's score cell should read once committed. */
	score: string
}

/**
 * One roll per field, in score-card order.
 *
 * Part one lands on exactly 63 — the bonus threshold — so this also pins that
 * boundary. Flush is taken once, at round 12, so this game never reaches the
 * flush-discard step; yahtzee-game.e2e.mts covers that.
 */
const rounds: Round[] = [
	{ field: 'aces', dice: [1, 1, 1, 2, 3], score: '3' },
	{ field: 'deuces', dice: [2, 2, 2, 4, 5], score: '6' },
	{ field: 'threes', dice: [3, 3, 3, 1, 2], score: '9' },
	{ field: 'fours', dice: [4, 4, 4, 1, 2], score: '12' },
	{ field: 'fives', dice: [5, 5, 5, 1, 2], score: '15' },
	{ field: 'sixes', dice: [6, 6, 6, 1, 2], score: '18' },
	{ field: 'threeOfKind', dice: [4, 4, 4, 5, 6], score: '23' },
	{ field: 'fourOfKind', dice: [5, 5, 5, 5, 2], score: '22' },
	{ field: 'fullHouse', dice: [2, 2, 3, 3, 3], score: '25' },
	{ field: 'smallStraight', dice: [1, 2, 3, 4, 6], score: '30' },
	{ field: 'largeStraight', dice: [2, 3, 4, 5, 6], score: '40' },
	{ field: 'flush', dice: [6, 6, 6, 6, 6], score: '50' },
	{ field: 'chance', dice: [6, 6, 5, 5, 4], score: '26' },
]

// part one 3+6+9+12+15+18 = 63, exactly on the threshold
const expectedPartOne = '63'
const expectedBonus = '35'
// part two 23+22+25+30+40+50+26
const expectedPartTwo = '216'
const expectedFinal = '314'

test('a full game scoring every field, with the part one bonus', async ({ page }) => {
	const game = new GamePage(page)
	await game.goto()
	await game.expectInProgress()

	for (const { field, dice, score } of rounds) {
		await game.enterRoll(dice, field)

		const row = await game.row(field)
		expect(row.score, `${field} should score ${score}`).toBe(score)
		expect(row.discarded, `${field} should not be discarded`).toBe(false)
		expect(row.dice, `${field} should show all five dice`).toBe(5)
	}

	expect(await game.totals()).toEqual({
		partOne: expectedPartOne,
		bonus: expectedBonus,
		partTwo: expectedPartTwo,
		final: expectedFinal,
	})

	await game.expectFinished()

	// Let the celebration finish before the test ends, so the recorded video
	// includes it and the frame count has settled.
	await game.waitForCelebrationToEnd()
	await game.expectCelebrated()
})
