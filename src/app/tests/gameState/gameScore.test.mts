// If you want to make the tests more fancy you can help by including permutations for patterns:
// https://stackoverflow.com/questions/9960908/permutations-in-javascript

import type { DieValue } from '../../src/game/gameConstants.js';
import { score, ValidScore, ScoreValue, discard } from '../../src/game/score/score';

const settings = {
	writeOutUnfoldedPatterns: true,
	writeOutMappedScores: false
}

const allRolls = new Map(generateAllPossibleNumbers());

function* generateAllPossibleNumbers(): Generator<[string, ValidScore]> {

    let a = 1 as DieValue;
    let b = 1 as DieValue;
    let c = 1 as DieValue;
    let d = 1 as DieValue;
    let e = 1 as DieValue;

    while(e <= 6) {
        var generatedScore = score([a,b,c,d,e]);
        yield [generatedScore.toString(), generatedScore]

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

    const distinctPatterns = new Set(shuffleCharacters(pattern));
	if (settings.writeOutUnfoldedPatterns){
		const distinctPatternsLog = JSON.stringify(Array.from(distinctPatterns));
		console.log(`A possible of ${distinctPatterns.size} patterns matching '${pattern}' ${distinctPatternsLog}`);
	}

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

		const possibleShuffles = Math.pow(pattern.length, pattern.length);

        for (let i = 0; i < possibleShuffles; i++)
        {
            for(let item of slideCharacter(pattern, i)) yield item;
        }
    }
}

function toPatternGenerator(pattern: Array<string>): PatternDefinition {
    return (a, b, c, d, e) => score(pattern.map(item => {
        if (item === 'a') return a;
        if (item === 'b') return b;
        if (item === 'c') return c;
        if (item === 'd') return d;
        if (item === 'e') return e;
        return +item;
    }) as ValidScore)
}

type PatternDefinition = (a: DieValue, b: DieValue, c: DieValue, d: DieValue, e: DieValue) => ValidScore
export function generateRandomScores(...validPatterns: Array<string>): [
    patternKey: string,
    allowedScores: ReadonlySet<ScoreValue>,
    disallowedScores: ReadonlySet<ScoreValue>
] {

    const patternKey = validPatterns[0];

    const allowedScoreMap = shufflePatterns(validPatterns)
        .reduce((accumulator, current) => {

            for (let rollAttempt of Array.from(allRolls.values())
                .filter(scoreAttempt => new Set(scoreAttempt).size == 5)
            ){
                const score = toPatternGenerator(current).apply(undefined, rollAttempt);
                accumulator.set(score.toString(), score)
            }

            return accumulator

        }, new Map<string, ScoreValue>());

		const disallowedScoreMap = new Map<string, ScoreValue>(
			Array.from(allRolls.entries())
				.filter(([key]) => !allowedScoreMap.has(key))
		)

	const allowedScores = new Set([...allowedScoreMap.values(), discard()]);
	const disallowedScores = new Set(disallowedScoreMap.values());

	if (settings.writeOutMappedScores) {
		console.debug('allowedScores')
		for(let s of allowedScores) {
			console.debug(`- ${s}`)
		}
		console.debug('disallowedScores')
		for(let s of Array.from(disallowedScores)) {
			console.debug(`- ${s}`)
		}
	}
    return [ patternKey, allowedScores, disallowedScores ];
}

export function generateContainingScores(containsDie: DieValue): [
    allowedScores: ReadonlySet<ScoreValue>,
    disallowedScores: ReadonlySet<ScoreValue>
] {
    const allowedScores = new Set<ScoreValue>([
        ...Array.from(allRolls.values()).filter(score => score.includes(containsDie)),
        discard()
    ]);

    const notAllowedScores = new Set<ScoreValue>(
        Array.from(allRolls.values()).filter(score => !score.includes(containsDie))
    );

    return [ allowedScores, notAllowedScores ];
}