import type { DieValue } from '../_logic/gameConstants.ts'
import type { ValidScore } from '../_logic/score/score.ts'

type Group = {
	values: Array<DieValue>,
	value: DieValue,
}

function groupBy(array: ReadonlyArray<DieValue>) {
	const groupedArray = array.reduce((accumulator, die) => {
		if (accumulator.has(die)) {
			const group = accumulator.get(die)!
			group.values.push(die)
			accumulator.set(die, group)
		}
		else {
			accumulator.set(die, { value: die, values: [die] })
		}
		return accumulator
	}, new Map<DieValue, Group>())

	return Array.from(groupedArray.values())
}

export type ScoreGroup = [smallGroup: Array<DieValue>, largeGroup: Array<DieValue>]

export function sortSimpleScore(amount: number, score: ReadonlyArray<DieValue>): ScoreGroup {
	const groupedResults = groupBy(score)

	const smallGroup = groupedResults
		.filter(group => group.value !== amount)
		.sort((a, b) => a.value - b.value)
		.flatMap(group => group.values)
	const largeGroup = groupedResults
		.filter(group => group.value === amount)
		.flatMap(group => group.values)

	return [smallGroup, largeGroup]
}

export function sortSomeOfKind(amount: number, score: ReadonlyArray<DieValue>): ScoreGroup {
	const splitIndex = 5 - amount
	const sortedResults = groupBy(score)
		.sort((a, b) => a.values.length - b.values.length)

	const flatResults = sortedResults.flatMap(r => r.values)
	const smallGroup = Array.from(flatResults.slice(0, splitIndex).values())
		.sort((a, b) => a - b)
	const largeGroup = Array.from(flatResults.slice(splitIndex).values())

	return [smallGroup, largeGroup]
}

export function sortFullHouse(score: ReadonlyArray<DieValue>): ScoreGroup {
	const sortedResults = groupBy(score)
		.sort((a, b) => a.values.length - b.values.length)
		.flatMap(group => group.values)

	const smallGroup = sortedResults.slice(0, 2)
	const largeGroup = sortedResults.slice(2)

	return [smallGroup, largeGroup]
}

export function sortStraight(score: ReadonlyArray<DieValue>): ScoreGroup {
	const groups = groupBy(score)
		.sort((a, b) => a.value - b.value)

	// A run uses each face at most once, so the first of every face belongs to
	// the run and any further copy is a stray beside it. Splitting on whole
	// groups instead dropped those copies from the cell altogether -- a roll
	// with a pair in it rendered four dice instead of five.
	const smallGroup = groups.flatMap(group => group.values.slice(1))
	const largeGroup = groups.map(group => group.value)

	return [smallGroup, largeGroup]
}
