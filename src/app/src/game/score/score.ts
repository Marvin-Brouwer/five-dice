import type { DieValue } from "../gameConstants.js"

const inspectSymbol = Symbol.for('nodejs.util.inspect.custom');
const scoreSymbol = Symbol.for('score');

export type ValidScore = 
    & [ DieValue, DieValue, DieValue, DieValue, DieValue ]
    & { [scoreSymbol]: 'validScore', toString(): string }

export type DiscardedScore = 
    & { [scoreSymbol]: 'discardedScore', toString(): string }

export type ScoreValue = ValidScore | DiscardedScore
export type ScoreContainer = ScoreValue | Array<ValidScore>

function discardToString() {
    return "/";
}
const discardedScore: DiscardedScore = Object.assign<any, any>({
        [scoreSymbol]: 'discardedScore'
    },{

    [inspectSymbol]: discardToString,

    toString: discardToString
})

export function discard(): DiscardedScore { return discardedScore; }
export function score(value: [one: DieValue, two: DieValue, three: DieValue, four: DieValue, five: DieValue]): ValidScore {
    
    function toString() {
        return `[ ${value.join(' ')} ]`;
    }
    return Object.assign<any, any>(
        value, {

            [scoreSymbol]: 'validScore',
            [inspectSymbol]: toString,

            toString
        })
}

export function isDiscarded(score: Array<ValidScore> | ValidScore | DiscardedScore): score is DiscardedScore {
    return score === discardedScore
}
export function isFlushScore(score: Array<ValidScore> | ValidScore | DiscardedScore): score is Array<ValidScore> {
    if (score === undefined) return false;
    if (isDiscarded(score)) return false;

    return !Object.getOwnPropertySymbols(score).includes(scoreSymbol);
}