// If you want to make the tests mor fancy you can help by including permutations:
// https://stackoverflow.com/questions/9960908/permutations-in-javascript

import { DieValue, discardedScore, Score, score, ScoreField, ValidScore } from '../../gameState/gameScore.mjs';

function AllSameDice(die: DieValue): ValidScore {
    return new Array(5).fill(die) as ValidScore
}

function AllDifferentDice(): ValidScore {
    return [1, 2, 3, 4, 5, 6].sort(() => (Math.random() > .5) ? 1 : -1).slice(0, 5) as ValidScore
}

function FillDice(die: DieValue, amount: 0 | 1 | 2 | 3 | 4 | 5): ValidScore {
    if (amount == 0) return AllDifferentDice();
    if (amount == 5) return AllSameDice(die);
    
    var others = [1, 2, 3, 4, 5, 6]
        .filter(d => d !== die)
        .sort(() => (Math.random() > .5) ? 1 : -1)
        .slice(0, 5 - amount);
    var fill = new Array(5)
        .fill(die, 0, amount)
        .slice(0, amount);
    return [
        ...fill,
        ...others
    ] as ValidScore
}

function* generate(): Generator<[string, ValidScore]> {
    
    let a: DieValue = 1 as DieValue;
    let b: DieValue = 1 as DieValue;
    let c: DieValue = 1 as DieValue;
    let d: DieValue = 1 as DieValue;
    let e: DieValue = 1 as DieValue;

    while(e <= 6) {
        var score = [a,b,c,d,e] as ValidScore;
        yield [score.join(''), score]
        
        if (a !== 6) {
            a ++;
            continue;
        } 
        a = 1;
        if (b !== 6) {
            b ++;
            continue;
        } 
        b = 1;
        if (c !== 6) {
            c ++;
            continue;
        } 
        c = 1;
        if (d !== 6) {
            d ++;
            continue;
        } 
        d = 1;
        if (e !== 6) {
            e ++;
            continue;
        } 
        e =1;
        break;
    }
}

const allRolls = new Map(generate());

function toPatternKey(pattern: ValidScore): string {
    return pattern
        .join('')
        .replaceAll('1','a')
        .replaceAll('2','b')
        .replaceAll('3','c')
        .replaceAll('4','d')
        .replaceAll('5','e')
}

export type PatternDefinition = (a: DieValue, b: DieValue, c: DieValue, d: DieValue, e: DieValue) => ValidScore
export function generateScores(...validPatterns: Array<PatternDefinition>): [
    patternKey: string,
    allowedScores: ReadonlySet<Score>,
    disallowedScores: ReadonlySet<Score>
] {

    const patternKey = toPatternKey(validPatterns[0](1,2,3,4,5));

    const allowedScoreMap = 
        validPatterns.reduce((accumulator, current) => {

            for (let rollAttempt of Array.from(allRolls.values())
                .filter(scoreAttempt => new Set(scoreAttempt).size == 5)
            ){
                const score = current.apply(undefined, rollAttempt);
                accumulator.set(score.join(''), score)
            }

            return accumulator

        }, new Map<string, Score>());

    const notAllowedScoreMap = new Map<string, Score>(
        Array.from(allRolls.entries())
            .filter(([key]) => !allowedScoreMap.has(key))
    )

    const allowedScores = new Set([...allowedScoreMap.values(), discardedScore]);
    const notAllowedScores = new Set(notAllowedScoreMap.values());
        
    return [ patternKey, allowedScores, notAllowedScores ];
}

export function generateSimpleScores(die: DieValue): [
    allowedScores: ReadonlySet<Score>,
    disallowedScores: ReadonlySet<Score>
] {
    const allowedScores = new Set<Score>([
        ...Array.from(allRolls.values()).filter(score => score.includes(die)),
        discardedScore
    ]);
    
    const notAllowedScores = new Set<Score>(
        Array.from(allRolls.values()).filter(score => !score.includes(die))
    );


    return [ allowedScores, notAllowedScores ];
}