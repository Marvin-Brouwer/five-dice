import { dice, type DiceTuple, type DieValue, type ScoreField } from '../game/_logic/gameConstants.ts'
import type { ScorePad } from '../game/_logic/score/scorePad.ts'
import { score } from '../game/_logic/score/score.ts'
import { isScoreApplicableToField } from '../game/_logic/score/scoreFieldValidator.ts'

const faces: DieValue[] = [1, 2, 3, 4, 5, 6]

function pick<T>(values: readonly T[]): T {
	return values[Math.floor(Math.random() * values.length)]!
}

function anyFace(): DieValue {
	return pick(faces)
}

/** `count` dice showing `value`, padded to five with anything at all. */
function atLeast(count: number, value: DieValue): DieValue[] {
	return [
		...Array.from({ length: count }, () => value),
		...Array.from({ length: 5 - count }, anyFace),
	]
}

function shuffle(roll: DieValue[]): DiceTuple {
	const shuffled = [...roll]
	for (let index = shuffled.length - 1; index > 0; index--) {
		const swap = Math.floor(Math.random() * (index + 1))
		;[shuffled[index], shuffled[swap]] = [shuffled[swap]!, shuffled[index]!]
	}
	return shuffled as DiceTuple
}

/** A roll that could legally be applied to `field`, built rather than searched for. */
function build(field: ScoreField): DieValue[] {
	switch (field) {
	// Upper section: at least one of the row's own face, one to three of them
	// so the example is not always the same shape.
	case 'aces':
	case 'deuces':
	case 'threes':
	case 'fours':
	case 'fives':
	case 'sixes':
		return atLeast(1 + Math.floor(Math.random() * 3), dice[field])

	case 'threeOfKind': return atLeast(3, anyFace())
	case 'fourOfKind': return atLeast(4, anyFace())
	case 'flush': return atLeast(5, anyFace())

	case 'fullHouse': {
		const three = anyFace()
		const two = pick(faces.filter(face => face !== three))
		return [three, three, three, two, two]
	}

	case 'smallStraight': {
		// Four consecutive faces starting at 1, 2 or 3, plus a stray.
		const start = pick([1, 2, 3]) as DieValue
		const run = [0, 1, 2, 3].map(step => (start + step) as DieValue)
		return [...run, anyFace()]
	}

	case 'largeStraight': {
		const start = pick([1, 2]) as DieValue
		return [0, 1, 2, 3, 4].map(step => (start + step) as DieValue)
	}

	case 'chance': return Array.from({ length: 5 }, anyFace)
	}
}

/**
 * An example roll for a score row, for the guide to show beside it.
 *
 * Built per field rather than sampled at random — a flush turns up once in
 * 1296 rolls — but checked with the game's own validator on the way out, so a
 * bug here shows up as a missing example rather than as a roll the app would
 * refuse to accept.
 */
export function exampleRoll(field: ScoreField): DiceTuple | undefined {
	const roll = shuffle(build(field))
	if (!isScoreApplicableToField(score(roll), field)) return undefined
	return roll
}

/**
 * A pad with every row already filled in, for the guide's example table.
 *
 * `score()` brands the tuples the way the game's own input does, so the score
 * card's cells, sorting and totals all work on it unchanged.
 */
export function examplePad(): ScorePad {
	const roll = (field: ScoreField) => score(exampleRoll(field) ?? [1, 2, 3, 4, 5])
	return {
		aces: roll('aces'),
		deuces: roll('deuces'),
		threes: roll('threes'),
		fours: roll('fours'),
		fives: roll('fives'),
		sixes: roll('sixes'),

		threeOfKind: roll('threeOfKind'),
		fourOfKind: roll('fourOfKind'),
		fullHouse: roll('fullHouse'),
		smallStraight: roll('smallStraight'),
		largeStraight: roll('largeStraight'),
		flush: [roll('flush')],
		chance: roll('chance'),
	}
}
