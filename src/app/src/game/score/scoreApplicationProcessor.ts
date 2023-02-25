import { ValidScore, isDiscarded, DiscardedScore } from '../../game/score/score';
import type { ScoreField } from '../gameConstants';
import type { ScorePad } from './scorePad';
import { isScoreApplicableToField } from './scoreFieldValidator';
import { InvalidScoreApplicationError } from './invalidScoreApplicationError';
import { discard as discardScore } from './score';

type SimpleScoreApplication = 
    | { field: ScoreField, score: ValidScore | DiscardedScore }
type DiscardFlushApplication = 
    | { field: 'flush', score: DiscardedScore}
type FlushApplication = 
    | { field: 'flush', score: ValidScore, discard: Exclude<ScoreField, 'flush'> }

export type ScoreApplication = 
    | SimpleScoreApplication
    | DiscardFlushApplication
    | FlushApplication

function isAppendedFlushApplication(application: ScoreApplication): application is FlushApplication {

    return application.field === 'flush' && !isDiscarded(application.score);
}
function isDiscardedFlushApplication(application: ScoreApplication): application is DiscardFlushApplication {

    return application.field === 'flush' && isDiscarded(application.score);
}
    
export function applyScore(scorePad: Readonly<ScorePad>, application: ScoreApplication) {

    console.log('applyScore', application)
    const { field, score } = application; 

    if (!isScoreApplicableToField(score, field))
        throw InvalidScoreApplicationError.invalidScoreApplication(scorePad, application);

    if (isAppendedFlushApplication(application)) {
        return processFlushAppendScore(scorePad, application);
    }
    if (isDiscardedFlushApplication(application)) {
        return processFlushDiscardScore(scorePad, application);
    }

    return processSimpleScore(scorePad, application);
        
};

function processFlushAppendScore(scorePad: Readonly<ScorePad>, application: FlushApplication): ScorePad {

    const { field, score, discard } = application; 

    const scoreField = scorePad[field];

    // Lock the flush after discarding
    if(isDiscarded(scoreField))
        throw InvalidScoreApplicationError.flushDiscarded(scorePad, application);

    const currentFlushValue = scorePad.flush;
    if (!!!discard && !isDiscarded(currentFlushValue) && currentFlushValue.length > 0) 
        throw InvalidScoreApplicationError.noDiscardOnFlush(scorePad, application);

    if (scorePad[discard] !== undefined)
        throw InvalidScoreApplicationError.scoreAlreadyApplied(scorePad, application);

    return Object.assign({},  scorePad, { 
        [field]: [...scoreField, score],
        [discard]: discardScore()
     });
}
function processFlushDiscardScore(scorePad: Readonly<ScorePad>, application: DiscardFlushApplication): ScorePad {

    const { field, score } = application; 

    if (isDiscarded(scorePad[field]))
        throw InvalidScoreApplicationError.scoreAlreadyApplied(scorePad, application);
    if ((scorePad[field] as Array<ValidScore>).length != 0)
        throw InvalidScoreApplicationError.cannotDiscardFlush(scorePad, application);

    return Object.assign({},  scorePad, { [field]: score });
}
function processSimpleScore(scorePad: Readonly<ScorePad>, application: SimpleScoreApplication): ScorePad {

    const { field, score } = application; 

    if (scorePad[field] !== undefined)
        throw InvalidScoreApplicationError.scoreAlreadyApplied(scorePad, application);

    return Object.assign({},  scorePad, { [field]: score });
}