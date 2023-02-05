import type { ScoreFields } from "./gameScore";

export const roundAmount = 13;

export type Dice = 'aces' | 'deuces' | 'threes' | 'fours' | 'fives' | 'sixes'
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export const dice: Record<Dice, DieValue> = { 
    aces: 1,
    deuces: 2,
    threes: 3,
    fours: 4,
    fives: 5,
    sixes: 6
};

export const emptyScorePad: ScoreFields = {
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
    chance: undefined,
}