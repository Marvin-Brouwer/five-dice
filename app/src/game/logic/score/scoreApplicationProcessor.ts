import type { ReadonlyState } from '@rooted/store'

import { ValidScore, isDiscarded, DiscardedScore } from './score.ts'
import type { ScoreField } from '../gameConstants.ts'
import type { ScorePad } from './scorePad.ts'
import { isScoreApplicableToField } from './scoreFieldValidator.ts'
import { InvalidScoreApplicationError } from './invalidScoreApplicationError.ts'
import { discard as discardScore } from './score.ts'

type SimpleScoreApplication =
    | { field: ScoreField, score: ValidScore | DiscardedScore }
type DiscardFlushApplication =
    | { field: 'flush', score: DiscardedScore}
type FlushApplication =
    | { field: 'flush', score: ValidScore, discard?: Exclude<ScoreField, 'flush'> }

export type ScoreApplication =
    | SimpleScoreApplication
    | DiscardFlushApplication
    | FlushApplication

function isAppendedFlushApplication(application: ScoreApplication): application is FlushApplication {

	return application.field === 'flush' && !isDiscarded(application.score)
}
function isDiscardedFlushApplication(application: ScoreApplication): application is DiscardFlushApplication {

	return application.field === 'flush' && isDiscarded(application.score)
}

export function applyScore(scorePad: ReadonlyState<ScorePad>, application: ScoreApplication) {

	const { field, score } = application

	if (!isScoreApplicableToField(score, field))
		throw InvalidScoreApplicationError.invalidScoreApplication(scorePad, application)

	if (isAppendedFlushApplication(application)) {
		return processFlushAppendScore(scorePad, application)
	}
	if (isDiscardedFlushApplication(application)) {
		return processFlushDiscardScore(scorePad, application)
	}

	return processSimpleScore(scorePad, application)

}

function processFlushAppendScore(scorePad: ReadonlyState<ScorePad>, application: FlushApplication): ScorePad {

	const { field, score, discard } = application

	const scoreField = scorePad[field]

	// Lock the flush after discarding
	if(isDiscarded(scoreField))
		throw InvalidScoreApplicationError.flushDiscarded(scorePad, application)

	const currentFlushValue = scorePad.flush
	if (!discard && !isDiscarded(currentFlushValue) && currentFlushValue.length > 0)
		throw InvalidScoreApplicationError.noDiscardOnFlush(scorePad, application)

	if (discard === undefined) {
		return Object.assign({}, scorePad, {
			[field]: [...scoreField, score],
		}) as ScorePad
	}

	if (scorePad[discard] !== undefined)
		throw InvalidScoreApplicationError.scoreAlreadyApplied(scorePad, application)

	return Object.assign({},  scorePad, {
		[field]: [...scoreField, score],
		[discard]: discardScore()
	}) as ScorePad
}
function processFlushDiscardScore(scorePad: ReadonlyState<ScorePad>, application: DiscardFlushApplication): ScorePad {

	const { field, score } = application

	if (isDiscarded(scorePad[field]))
		throw InvalidScoreApplicationError.scoreAlreadyApplied(scorePad, application)
	if ((scorePad[field] as ReadonlyArray<ValidScore>).length != 0)
		throw InvalidScoreApplicationError.cannotDiscardFlush(scorePad, application)

	return Object.assign({},  scorePad, { [field]: score }) as ScorePad
}
function processSimpleScore(scorePad: ReadonlyState<ScorePad>, application: SimpleScoreApplication): ScorePad {

	const { field, score } = application

	if (scorePad[field] !== undefined)
		throw InvalidScoreApplicationError.scoreAlreadyApplied(scorePad, application)

	return Object.assign({},  scorePad, { [field]: score }) as ScorePad
}