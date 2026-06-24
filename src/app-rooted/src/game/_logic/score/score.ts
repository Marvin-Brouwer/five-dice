import type { ReadonlyState } from '@rooted/store'

import type { DieValue } from '../gameConstants.js'

const inspectSymbol = Symbol.for('nodejs.util.inspect.custom')
const scoreSymbol = Symbol.for('score')

export type ValidScore =
    & [ DieValue, DieValue, DieValue, DieValue, DieValue ]
    & { [scoreSymbol]: 'validScore', toString(): string }

export type DiscardedScore =
    & { [scoreSymbol]: 'discardedScore', toString(): string }

export type ScoreValue = ValidScore | DiscardedScore
export type ScoreContainer = ScoreValue | ReadonlyArray<ValidScore>

type AnyScoreInput =
    | ReadonlyState<ValidScore>
    | ReadonlyState<DiscardedScore>
    | ReadonlyState<Array<ValidScore>>

function discardToString() {
	return '/'
}
const discardedScore: DiscardedScore = Object.assign({
	[scoreSymbol]: 'discardedScore'
},{

	[inspectSymbol]: discardToString,

	toString: discardToString
}) as DiscardedScore

export function discard(): DiscardedScore { return discardedScore }
export function score(value: ReadonlyState<[one: DieValue, two: DieValue, three: DieValue, four: DieValue, five: DieValue]>): ValidScore {

	const tuple: [DieValue, DieValue, DieValue, DieValue, DieValue] = [value[0], value[1], value[2], value[3], value[4]]
	function toString() {
		return `[ ${tuple.join(' ')} ]`
	}
	return Object.assign(
		tuple, {

			[scoreSymbol]: 'validScore',
			[inspectSymbol]: toString,

			toString
		}) as ValidScore
}

export function isDiscarded(score: AnyScoreInput): score is ReadonlyState<DiscardedScore> {
	return score === discardedScore
}
export function isFlushScore(score: AnyScoreInput): score is ReadonlyState<Array<ValidScore>> {
	if (score === undefined) return false
	if (isDiscarded(score)) return false

	return !Object.getOwnPropertySymbols(score).includes(scoreSymbol)
}