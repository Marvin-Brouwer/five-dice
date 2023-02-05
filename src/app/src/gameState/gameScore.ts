import { dice, DieValue } from "./gameConstants.js"

export type ScoreField = keyof ScoreFields

export type ValidScore = [DieValue, DieValue, DieValue, DieValue, DieValue]
export type DiscardedScore = []

export type Score = ValidScore | DiscardedScore

export type ScoreFields = {
    aces: Score | undefined
    deuces: Score | undefined
    threes: Score | undefined
    fours: Score | undefined
    fives: Score | undefined
    sixes: Score | undefined

    threeOfKind: Score | undefined
    fourOfKind: Score | undefined
    fullHouse: Score | undefined
    smallStraight: Score | undefined
    largeStraight: Score | undefined
    flush: Array<[Score, Exclude<ScoreField, 'flush'>]>
    chance: Score | undefined
}

export const discardedScore = [] as DiscardedScore;
export function score(one: DieValue, two: DieValue, three: DieValue, four: DieValue, five: DieValue): ValidScore {
    return [one, two, three, four, five]
}

function isDiscarded(score: Score): score is DiscardedScore {
    return score == discardedScore;
}

export function validateScore(score: Score, field: ScoreField): boolean {

    if (isDiscarded(score)) return true;

    switch (field) {
        case 'aces': return score.includes(dice[field]);
        case 'deuces': return score.includes(dice[field]);
        case 'threes': return score.includes(dice[field]);
        case 'fours': return score.includes(dice[field]);
        case 'fives': return score.includes(dice[field]);
        case 'sixes': return score.includes(dice[field]);

        case "threeOfKind": return hasSomeOfKind(3, score);
        case "fourOfKind": return hasSomeOfKind(4, score);
        case 'fullHouse': return isFullHouse(score);
        case 'smallStraight': return isStraight(4, score);
        case 'largeStraight': return isStraight(5, score);
        case 'flush': return isFlush(score);
        case 'chance': return true;
    }
}

function hasSomeOfKind(amount: number, score: ValidScore): boolean {

    const grouped = score.reduce<Array<number>>(
        (counter, currentDie) => (counter[currentDie] = counter[currentDie] + 1 || 1, counter), []);

    return grouped
        .some(value => value >= amount)
}

function isFullHouse(score: ValidScore): boolean {

    const grouped = score.reduce<Array<number>>(
        (counter, currentDie) => (counter[currentDie] = counter[currentDie] + 1 || 1, counter), []);

    const smallGroup = grouped
        .filter(groupValue => groupValue == 2)
    if (smallGroup.length === 0) return false;

    const largeGroup = grouped
        .filter(groupValue => groupValue == 3)
    if (largeGroup.length === 0) return false;

    return true
}

function isStraight(amount: number, score: ValidScore): boolean {

    const distinct = new Set(score)
    
    return distinct.size >= amount
}

function isFlush(score: ValidScore): boolean {

    const distinct = new Set(score)

    return distinct.size == 1
}