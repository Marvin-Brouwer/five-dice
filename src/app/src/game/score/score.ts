import type { DieValue } from "../gameConstants.js"

const scoreSymbol = Symbol.for('score');

export type ValidScore = 
    & [ DieValue, DieValue, DieValue, DieValue, DieValue ]
    & { [scoreSymbol]: 'validScore', toString(): string }

export type DiscardedScore = 
    & { [scoreSymbol]: 'discardedScore', toString(): string }

export type ScoreValue = ValidScore | DiscardedScore
export type ScoreContainer = ScoreValue | Array<ValidScore>

const discardedScore: DiscardedScore = {

    [scoreSymbol]: 'discardedScore',

    toString() {
        return "/";
    }
}

export function discard(): DiscardedScore { return discardedScore; }
export function score(value: [one: DieValue, two: DieValue, three: DieValue, four: DieValue, five: DieValue]): ValidScore {
    return Object.assign<any, any>(
        value, {

            [scoreSymbol]: 'validScore',

            toString() {
                return `[ ${this.roll.join(' ')} ]`;
            }
        })
}

export function isDiscarded(score: Array<ValidScore> | ValidScore | DiscardedScore): score is DiscardedScore {
    return score === discardedScore
}
export function isFlushScore(score: Array<ValidScore> | ValidScore | DiscardedScore): score is Array<ValidScore> {
    if (isDiscarded(score)) return false;

    return !Object.getOwnPropertySymbols(score).includes(scoreSymbol);
}