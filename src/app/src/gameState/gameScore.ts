import { dice, DieValue } from "./gameConstants.js"

abstract class GameScore { }

type ValidScoreRoll = [DieValue, DieValue, DieValue, DieValue, DieValue]
export class ValidScore extends GameScore {
    constructor(private roll: ValidScoreRoll) {
        super();
    }

    includes(die: DieValue): boolean {
        return this.roll.includes(die);
    }

    reduce<T>(callbackfn: (previousValue: T, currentValue: DieValue, currentIndex: number, array: DieValue[]) => T, reducer: T): T {
        return this.roll.reduce<T>(callbackfn, reducer);
    }

    filter(predicate: (value: DieValue, index: number, array: DieValue[]) => boolean) {
        return this.roll.filter(predicate)
    }

    map<T> (callbackfn: (value: DieValue, index: number, array: DieValue[]) => T) {
        return this.roll.map<T>(callbackfn)
    }

    sort(compareFn: (a: DieValue, b: DieValue) => number) {
        return this.roll.sort(compareFn)
    }

    toArray(){
        return this.roll;
    }

    toString() {
        return `${this.roll.join(' ')}`;
    }
}
export class DiscardedScore extends GameScore {

    // This is here to satisfy compiler
    public readonly isDiscarded = true;
    
    constructor() {
        super();
    }

    toString() {
        return "/";
    }
}
export class FlushScore extends ValidScore {

    constructor(roll: ValidScore, public discardField: Exclude<ScoreField, 'flush'>) {
        super(roll.toArray());
    }

    toString() {
        return `${super.toString()} - ${this.discardField}`;
    }
}

export type ScoreField = keyof ScoreFields

export type Score  = ValidScore | DiscardedScore

export type ScoreFields = {
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
    flush:  Array<FlushScore> | DiscardedScore
    chance: ValidScore | DiscardedScore | undefined
}

export const discardedScore = new DiscardedScore();
export function score(one: DieValue, two: DieValue, three: DieValue, four: DieValue, five: DieValue): ValidScore {
    return new ValidScore([one, two, three, four, five])
}

export function isDiscarded(score: Array<ValidScore> | ValidScore | DiscardedScore): score is DiscardedScore {
    return score === discardedScore
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

    const distinct = new Set(score.toArray())
    
    return distinct.size >= amount
}

function isFlush(score: ValidScore): boolean {

    const distinct = new Set(score.toArray())

    return distinct.size == 1
}