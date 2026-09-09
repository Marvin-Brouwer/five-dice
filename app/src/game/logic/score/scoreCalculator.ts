import type { ReadonlyState } from '@rooted/store'

import type { DieValue, ScoreField } from '../gameConstants.ts'
import { InvalidScoreError } from './invalidScoreError.ts'
import { ValidScore, isDiscarded, isFlushScore } from './score.ts'
import type { ScorePad } from './scorePad.ts'

export function calculateScoreForPad(scorePad: ReadonlyState<ScorePad>, field: ScoreField): number {

	const score = scorePad[field]

	if (score === undefined) return 0
	if (isDiscarded(score)) return 0
	if (isFlushScore(score)) {
		if (field !== 'flush') throw InvalidScoreError.normalScoreCannotBeArray(score, field)
		return calculateFlush(score)
	}

	return calculateScore(score, field)
}

export function calculateScore(score: ReadonlyState<ValidScore>, field: ScoreField): number {

	switch (field) {
	case 'aces': return diceSum(score, 1)
	case 'deuces': return diceSum(score, 2)
	case 'threes': return diceSum(score, 3)
	case 'fours': return diceSum(score, 4)
	case 'fives': return diceSum(score, 5)
	case 'sixes': return diceSum(score, 6)

	case 'threeOfKind': return diceTotal(score)
	case 'fourOfKind': return diceTotal(score)
	case 'fullHouse': return 25
	case 'smallStraight': return 30
	case 'largeStraight': return 40
	case 'flush': return calculateFlush([score as ValidScore])
	case 'chance': return diceTotal(score)
	}
}

function diceSum(score: ReadonlyState<ValidScore>, value: DieValue): number {

	return score.reduce((reducer, currentDie) => currentDie === value
		? reducer + value
		: reducer,
	0)
}
function diceTotal(score: ReadonlyState<ValidScore>): number {

	return score.reduce((reducer, currentDie) => reducer + currentDie, 0)
}

const firstFlushScore = 50
const additionalFlushScore = 100
export function calculateFlush(score: ReadonlyState<Array<ValidScore>>): number {

	if (score.length === 0) return 0
	if (score.length === 1) return firstFlushScore

	return score
		.slice(1)
		.reduce((reducer) => reducer + additionalFlushScore, firstFlushScore)
}

export function calculatePartOneSubTotal(scorePad: ReadonlyState<ScorePad>): number {

	return (
		calculateScoreForPad(scorePad, 'aces') +
		calculateScoreForPad(scorePad, 'deuces') +
		calculateScoreForPad(scorePad, 'threes') +
		calculateScoreForPad(scorePad, 'fours') +
		calculateScoreForPad(scorePad, 'fives') +
		calculateScoreForPad(scorePad, 'sixes')
	)
}

const partOneBonus = 35
const partOneBonusConstraint = 63
export function hasPartOneBonus(partOneSubTotal: number): boolean {
	return partOneSubTotal >= partOneBonusConstraint

}

export function calculatePartOneBonus(partOneSubTotal: number): number {
	if (!hasPartOneBonus(partOneSubTotal)) return 0
	return partOneBonus
}

export function calculatePartTwoTotal(scorePad: ReadonlyState<ScorePad>): number {

	return (
		calculateScoreForPad(scorePad, 'threeOfKind') +
		calculateScoreForPad(scorePad, 'fourOfKind') +
		calculateScoreForPad(scorePad, 'fullHouse') +
		calculateScoreForPad(scorePad, 'smallStraight') +
		calculateScoreForPad(scorePad, 'largeStraight') +
		calculateScoreForPad(scorePad, 'flush') +
		calculateScoreForPad(scorePad, 'chance')
	)
}

export function calculateGameTotal(partOneTotal: number, bonus: number, partTwoTotal: number): number {
	return partOneTotal + bonus + partTwoTotal
}