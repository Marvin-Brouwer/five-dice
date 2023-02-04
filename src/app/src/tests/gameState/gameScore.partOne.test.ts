/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { Dice, dice, DieValue, ScoreField, ScoreFields, scoreValidator } from '../../gameState/gameScore.mjs';
import { generateSimpleScores } from './gameScore.test.mjs';

describe('scoreValidator', () => {

    test(`partOne`, async partOneTestContext => {
            
        for(let [field, die] of Object.entries(dice) as Array<[Dice, DieValue]>) {
            await partOneTestContext.test(`partOne ${field}`, async testContext => {

                const [allowedScores, disallowedScores] = generateSimpleScores(die)
                for(let score of allowedScores) {
                    await testContext.test(`validTheory [${score.join('')}]`, () => {

                        // Arrange
                        const sut = () => scoreValidator(score, field);

                        // Act
                        const result = sut();

                        // Assert
                        assert.strictEqual(result, true);
                    })
                }

                for(let score of disallowedScores) {
                    await testContext.test(`inValidTheory [${score.join('')}]`, () => {

                        // Arrange
                        const sut = () => scoreValidator(score, field);

                        // Act
                        const result = sut();

                        // Assert
                        assert.strictEqual(result, false);
                    })
                }
            })
        }
    })
});