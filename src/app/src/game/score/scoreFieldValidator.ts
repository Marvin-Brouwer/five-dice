import { dice, ScoreField } from '../gameConstants.js'
import { ValidScore, isDiscarded, ScoreValue } from '../../game/score/score'
import { isFlushScore } from './score'

export function isScoreApplicableToField(score: ScoreValue, field: ScoreField): boolean {

	if (isDiscarded(score)) return true
	if (isFlushScore(score)) field != 'flush'

	switch (field) {
	case 'aces': return score.includes(dice[field])
	case 'deuces': return score.includes(dice[field])
	case 'threes': return score.includes(dice[field])
	case 'fours': return score.includes(dice[field])
	case 'fives': return score.includes(dice[field])
	case 'sixes': return score.includes(dice[field])

	case 'threeOfKind': return hasSomeOfKind(3, score)
	case 'fourOfKind': return hasSomeOfKind(4, score)
	case 'fullHouse': return isFullHouse(score)
	case 'smallStraight': return isSmallStraight(score)
	case 'largeStraight': return isLargeStraight(score)
	case 'flush': return isFlush(score)
	case 'chance': return true
	}
}

function hasSomeOfKind(amount: number, score: ValidScore): boolean {

	const grouped = score.reduce<Array<number>>(
		(counter, currentDie) => (counter[currentDie] = counter[currentDie] + 1 || 1, counter), [])

	return grouped
		.some(value => value >= amount)
}

function isFullHouse(score: ValidScore): boolean {

	const grouped = score.reduce<Array<number>>(
		(counter, currentDie) => (counter[currentDie] = counter[currentDie] + 1 || 1, counter), [])

	const smallGroup = grouped
		.filter(groupValue => groupValue <= 2)[0]
	if (smallGroup !== 2) return false

	const largeGroup = grouped
		.filter(groupValue => groupValue >= 3)[0]
	if (largeGroup !== 3) return false

	return true
}

function isLargeStraight(score: ValidScore): boolean {

	const largeStraightSize = 5
	const distinct = new Set(score)

	// In the case of a large straight, we can just check all numbers to be unique and then if 1 and 6 are exclusively included
	const isStraight = distinct.size >= largeStraightSize
	const isConsecutive = !(distinct.has(1) && distinct.has(6))

	return isStraight && isConsecutive
}

function isSmallStraight(score: ValidScore): boolean {

	const smallStraightSize = 4
	const distinct = new Set(score)

	// First check if there's at least 4 distinct numbers
	// If that's the case, check if the numbers are consecutive, which is expensive

	const isStraight = distinct.size >= smallStraightSize
	const countConsecutive = () => Array.from(distinct)
		.sort()
		.reduce((previousCount, currentValue, index, all) => {
			if (index == 0) return [1]

			const previous = all[index - 1]
			const difference = currentValue - previous
			if (difference === 1) {
				previousCount[previousCount.length -1] +=1
				return previousCount
			}

			return [...previousCount, 1]

		}, [0])
	const hasFourConsecutive = () => countConsecutive().some(count =>  count >= smallStraightSize)

	const result = isStraight && hasFourConsecutive()

	return result

}

function isFlush(score: ValidScore): boolean {

	const distinct = new Set(score)

	return distinct.size == 1
}