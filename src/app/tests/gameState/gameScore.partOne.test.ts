/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { validateScore } from '../../src/gameState/gameScore.js';
import { generateSimpleScores } from './gameScore.test.mjs';
import { dice, Dice } from '../../src/gameState/gameConstants.js';

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
            await testContext.test(`validTheory [${score.join('')}]`, () => {

                // Arrange
                const sut = () => validateScore(score, field);

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, true);
            })
        }

        for(let score of disallowedScores) {
            await testContext.test(`inValidTheory [${score.join('')}]`, () => {

                // Arrange
                const sut = () => validateScore(score, field);

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, false);
            })
        }
    })
}