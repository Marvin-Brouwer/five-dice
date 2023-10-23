/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { isScoreApplicableToField } from '../../src/game/score/scoreFieldValidator';
import { generateRandomScores } from './gameScore.test.mjs';

const [pattern, allowedScores, disallowedScores] = generateRandomScores(
    'abcde'
);

describe('scoreValidator', () => {

    test(`largeStraight ${pattern}`, async testContext => {

        for(let score of allowedScores) {
            await testContext.test(`validTheory ${score}`, () => {

                // Arrange
                const sut = () => isScoreApplicableToField(score, 'largeStraight');

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, true);
            })
        }

        for(let score of disallowedScores) {
            await testContext.test(`inValidTheory ${score}`, () => {

                // Arrange
                const sut = () => isScoreApplicableToField(score, 'largeStraight');

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, false);
            })
        }
    })
});