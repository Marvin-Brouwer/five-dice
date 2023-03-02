/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { isScoreApplicableToField } from '../../src/game/score/scoreFieldValidator';
import { generateSimpleScores } from './gameScore.test.mjs';
import { dice, Dice } from '../../src/game/gameConstants.js';

type TestFn = Exclude<Parameters<typeof test>[0], undefined>
type TestContext = Parameters<TestFn>[0]

describe('scoreValidator', () => {

    test(`partOne`, async testContext => {
            
        await testSection('aces', testContext);
        await testSection('deuces', testContext);
        await testSection('threes', testContext);
        await testSection('fours', testContext);
        await testSection('fives', testContext);
        await testSection('sixes', testContext);
    })
});

async function testSection(field: Dice, sectionTestContext: TestContext) {
    await sectionTestContext.test(`partOne ${field}`, async testContext => {

        const die = dice[field];
        const [allowedScores, disallowedScores] = generateSimpleScores(die);

        for(let score of allowedScores) {
            await testContext.test(`validTheory [${score}]`, () => {

                // Arrange
                const sut = () => isScoreApplicableToField(score, field);

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, true);
            })
        }

        for(let score of disallowedScores) {
            await testContext.test(`inValidTheory [${score}]`, () => {

                // Arrange
                const sut = () => isScoreApplicableToField(score, field);

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, false);
            })
        }
    })
}