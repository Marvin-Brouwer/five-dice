import type { ScoreField } from "../gameConstants.js"
import { ValidScore, isDiscarded, ScoreContainer } from '../../game/score/score';
import type { ScorePad } from './scorePad';
import { InvalidScoreError } from "./invalidScoreError.js";
import { isFlushScore } from './score';

export function calculateScore(scorePad: ScorePad, field: ScoreField): number {

    const score = scorePad[field];

    if (score === undefined) return 0;
    if (isDiscarded(score)) return 0;
    if (isFlushScore(score)) {
        if (field !== 'flush') throw InvalidScoreError.normalScoreCannotBeArray(score, field)
        return calculateFlush(score);
    }

    switch (field) {
        case 'aces': return diceTotal(score);
        case 'deuces': return diceTotal(score);
        case 'threes': return diceTotal(score);
        case 'fours': return diceTotal(score);
        case 'fives': return diceTotal(score);
        case 'sixes': return diceTotal(score);

        case "threeOfKind": return diceTotal(score);
        case "fourOfKind": return diceTotal(score);
        case 'fullHouse': return 25;
        case 'smallStraight': return 30;
        case 'largeStraight': return 40;
        case 'flush': throw InvalidScoreError.flushCannotBeNormalScore(score);
        case 'chance': return diceTotal(score);
    }
}

function diceTotal(score: ValidScore): number {

    return score.reduce((reducer, currentDie) => reducer + currentDie, 0);
}

const firstFlushScore = 50;
const additionalFlushScore = 100;
function calculateFlush(score: Array<ValidScore>): number {

    if (score.length === 1) return firstFlushScore;

    return score
        .slice(1)
        .reduce((reducer, _) => reducer + additionalFlushScore, firstFlushScore);
}

export function calculatePartOneSubTotal(scorePad: ScorePad): number {

    return (
        calculateScore(scorePad, 'aces') + 
        calculateScore(scorePad, 'deuces') + 
        calculateScore(scorePad, 'threes') + 
        calculateScore(scorePad, 'fours') + 
        calculateScore(scorePad, 'fives') + 
        calculateScore(scorePad, 'sixes')
    );    
}

const partOneBonus = 35;
const partOneBonusConstraint = 63;
export function hasPartOneBonus(partOneSubTotal: number): boolean {
    return partOneSubTotal >= partOneBonusConstraint
    
}

export function calculatePartOneBonus(partOneSubTotal: number): number {
    if (!hasPartOneBonus(partOneSubTotal)) return 0;
    return partOneBonus;
}

export function calculatePartTwoTotal(scorePad: ScorePad): number {

    return (
        calculateScore(scorePad, 'threeOfKind') + 
        calculateScore(scorePad, 'fourOfKind') + 
        calculateScore(scorePad, 'fullHouse') + 
        calculateScore(scorePad, 'smallStraight') + 
        calculateScore(scorePad, 'largeStraight') + 
        calculateScore(scorePad, 'flush') + 
        calculateScore(scorePad, 'chance')
    );    
}

export function calculateGameTotal(partOneTotal: number, bonus: number, partTwoTotal: number): number {
    return partOneTotal + bonus + partTwoTotal;
}