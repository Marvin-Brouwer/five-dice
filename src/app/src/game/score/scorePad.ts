import type { ValidScore, DiscardedScore } from '../../game/score/score';

export type ScorePad = {
    aces: ValidScore | DiscardedScore | undefined
    deuces: ValidScore | DiscardedScore | undefined
    threes: ValidScore | DiscardedScore | undefined
    fours: ValidScore | DiscardedScore | undefined
    fives: ValidScore | DiscardedScore | undefined
    sixes: ValidScore | DiscardedScore | undefined

    threeOfKind: ValidScore | DiscardedScore | undefined
    fourOfKind: ValidScore | DiscardedScore | undefined
    fullHouse: ValidScore | DiscardedScore | undefined
    smallStraight: ValidScore | DiscardedScore | undefined
    largeStraight: ValidScore | DiscardedScore | undefined
    flush:  Array<ValidScore> | DiscardedScore
    chance: ValidScore | DiscardedScore | undefined
};

export function createScorePad(): ScorePad {
    return {
        aces: undefined,
        deuces: undefined,
        threes: undefined,
        fours: undefined,
        fives: undefined,
        sixes: undefined,

        threeOfKind: undefined,
        fourOfKind: undefined,
        fullHouse: undefined,
        smallStraight: undefined,
        largeStraight: undefined,
        flush: new Array(),
        chance: undefined
    };
}