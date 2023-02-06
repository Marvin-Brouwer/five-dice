import { dice, ScoreField } from "../gameConstants.js"
import { ValidScore, isDiscarded, ScoreValue } from '../../game/score/score';
import { isFlushScore } from './score';

export function isScoreApplicableToField(score: ScoreValue, field: ScoreField): boolean {

    if (isDiscarded(score)) return true;
    if (isFlushScore(score)) field != "flush";

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