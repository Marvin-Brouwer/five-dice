// If you want to make the tests more fancy you can help by including permutations for patterns:
// https://stackoverflow.com/questions/9960908/permutations-in-javascript

import { DieValue, discardedScore, score, Score, ValidScore } from '../../gameState/gameScore.mjs';

const allRolls = new Map(generateAllPossibleNumbers());

function* generateAllPossibleNumbers(): Generator<[string, ValidScore]> {
    
    let a = 1 as DieValue;
    let b = 1 as DieValue;
    let c = 1 as DieValue;
    let d = 1 as DieValue;
    let e = 1 as DieValue;

    while(e <= 6) {
        var generatedScore = score(a,b,c,d,e);
        yield [generatedScore.join(''), generatedScore]
        
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

type PatternItem = 'a' | 'b' | 'c' | 'd' | 'e'; 
type Pattern = [PatternItem, PatternItem, PatternItem, PatternItem, PatternItem]

function shufflePatterns(patterns: Array<string>): Array<Pattern> {
    return patterns.flatMap(shufflePattern)
}
function shufflePattern(pattern: string): Array<Pattern> {

    let distinctPatterns = new Set(shuffleCharacters(pattern));
    console.log(`possible patterns matching '${pattern}': `, JSON.stringify(Array.from(distinctPatterns)));
    
    return Array.from(distinctPatterns).map(p => p.split('') as Pattern);

    function* slideCharacter(pattern: string, charToMove: number) {

        for (let i = 0; i < pattern.length; i++){
            let newValue = pattern.split('');

            var newChar = newValue.at(charToMove)!
            var oldChar = newValue.at(i)!

            newValue[i] = newChar;
            newValue[charToMove] = oldChar;

            yield newValue.join('');
            yield newValue.reverse().join('');
        }
        for (let i = 0; i < pattern.length; i++){
            let newValue = pattern.split('').reverse();

            var newChar = newValue.at(charToMove)!
            var oldChar = newValue.at(i)!

            newValue[i] = newChar;
            newValue[charToMove] = oldChar;

            yield newValue.join('');
            yield newValue.reverse().join('');
        }
    }
    function* shuffleCharacters(pattern: string) {

        for (let i = 0; i < pattern.length; i++)
        {
            for(let item of slideCharacter(pattern, i)) yield item;
        }
    }
}

function toPatternGenerator(pattern: Array<string>): PatternDefinition {
    return (a, b, c, d, e) => pattern.map(item => {
        if (item === 'a') return a;
        if (item === 'b') return b;
        if (item === 'c') return c;
        if (item === 'd') return d;
        return e;
    }) as ValidScore
}

function toPatternKey(pattern: ValidScore): string {
    return pattern
        .join('')
        .replaceAll('1','a')
        .replaceAll('2','b')
        .replaceAll('3','c')
        .replaceAll('4','d')
        .replaceAll('5','e')
}

type PatternDefinition = (a: DieValue, b: DieValue, c: DieValue, d: DieValue, e: DieValue) => ValidScore
export function generateScores(...validPatterns: Array<string>): [
    patternKey: string,
    allowedScores: ReadonlySet<Score>,
    disallowedScores: ReadonlySet<Score>
] {

    const patternKey = validPatterns[0];

    const allowedScoreMap = shufflePatterns(validPatterns)
        .reduce((accumulator, current) => {

            for (let rollAttempt of Array.from(allRolls.values())
                .filter(scoreAttempt => new Set(scoreAttempt).size == 5)
            ){
                const score = toPatternGenerator(current).apply(undefined, rollAttempt);
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