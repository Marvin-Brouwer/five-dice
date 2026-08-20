import type { ReadonlyState } from '@rooted/store'

import type { ScoreField } from '../gameConstants.ts'
import { isDiscarded, type ValidScore } from './score.ts'
import type { ScorePad } from './scorePad.ts'

/**
 * The flush entries already committed. The flush slot starts as an empty
 * array rather than undefined, and becomes a DiscardedScore once thrown away.
 */
export function flushEntries(pad: ReadonlyState<ScorePad>): ReadonlyArray<ReadonlyState<ValidScore>> {
	const cell = pad.flush
	return isDiscarded(cell) ? [] : cell
}

/**
 * What `pad[field]` would hold if `score` were applied to it.
 *
 * Every field simply takes the roll, except flush, which accumulates: a
 * second flush appends rather than replaces, which is what drives both the
 * `+N` badge and the 50/150/250 progression.
 *
 * Kept separate from the components so a hover preview and the committed
 * render are fed from the same projection.
 */
export function projectedCell(
	pad: ReadonlyState<ScorePad>,
	field: ScoreField,
	score: ReadonlyState<ValidScore>,
): ReadonlyState<ScorePad[ScoreField]> {
	if (field !== 'flush') return score
	return [...flushEntries(pad), score]
}
