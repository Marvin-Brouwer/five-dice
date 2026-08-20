import type { Dice, ScoreField } from './gameConstants.ts'

/**
 * The canonical field lists.
 *
 * These are domain constants, not presentation: the score pad, the calculator,
 * the card and the row picker all have to agree on which fields exist and in
 * what order. Keep them here rather than deriving them from a label table.
 */
export const partOneFields: Dice[] = [
	'aces', 'deuces', 'threes', 'fours', 'fives', 'sixes',
]

export const partTwoFields: Exclude<ScoreField, Dice>[] = [
	'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'flush', 'chance',
]

/** Every field, in score-card order. */
export const scoreFieldOrder: ScoreField[] = [...partOneFields, ...partTwoFields]
