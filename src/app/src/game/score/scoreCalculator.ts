import type { ScoreField } from "../gameConstants.js"
import { ValidScore, isDiscarded, ScoreContainer } from '../../game/score/score';
import type { ScorePad } from './scorePad';
import { InvalidScoreError } from "./invalidScoreError.js";
import { isFlushScore } from './score';

export function calculateScore(score: ScoreContainer | undefined, field: ScoreField): number {

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

function calculateScoreForPad(scorePad: ScorePad, field: ScoreField) {
    return calculateScore(scorePad[field], field);
}

export function calculatePartOneSubTotal(scorePad: ScorePad): number {

    return (
        calculateScoreForPad(scorePad, 'aces') + 
        calculateScoreForPad(scorePad, 'deuces') + 
        calculateScoreForPad(scorePad, 'threes') + 
        calculateScoreForPad(scorePad, 'fours') + 
        calculateScoreForPad(scorePad, 'fives') + 
        calculateScoreForPad(scorePad, 'sixes')
    );    
}

const partOneBonus = 35;
const partOneBonusConstraint = 63;
export function hasPartOneBonus(partOneSubTotal: number): boolean {
    return partOneSubTotal >= partOneBonusConstraint
    
}

export function calculatePartOneTotal(partOneSubTotal: number): number {
    if (!hasPartOneBonus(partOneSubTotal)) return partOneSubTotal;
    return partOneSubTotal + partOneBonus;
}

export function calculatePartTwoTotal(scorePad: ScorePad): number {

    return (
        calculateScoreForPad(scorePad, 'threeOfKind') + 
        calculateScoreForPad(scorePad, 'fourOfKind') + 
        calculateScoreForPad(scorePad, 'fullHouse') + 
        calculateScoreForPad(scorePad, 'smallStraight') + 
        calculateScoreForPad(scorePad, 'largeStraight') + 
        calculateScoreForPad(scorePad, 'flush') + 
        calculateScoreForPad(scorePad, 'chance')
    );    
}

export function calculateGameTotal(partOneTotal: number, partTwoTotal: number): number {
    return partOneTotal + partTwoTotal;
}