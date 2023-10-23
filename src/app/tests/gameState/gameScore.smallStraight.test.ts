/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { isScoreApplicableToField } from '../../src/game/score/scoreFieldValidator';
import { generateRandomScores } from './gameScore.test.mjs';
import { score } from '../../src/game/score/score';

const [pattern, allowedScores, disallowedScores] = generateRandomScores(
    '1234a', '2345a', '3456a', '12345', '23456'
);

describe('scoreValidator', () => {

    test(`test-cases`, async testContext => {

		await testContext.test(`79-incorrect-small-straight [11235]`, () => {

			// Arrange
			const testScore = score([1, 1, 2, 3, 5]);
			const sut = () => isScoreApplicableToField(testScore, 'smallStraight');

			// Act
			const result = sut();

			// Assert
			assert.strictEqual(result, false);
		})
	})

    test(`smallStraight ${pattern}`, async testContext => {

		await testContext.test(`test-case 79-incorrect-small-straight [11235]`, () => {

			// Arrange
			const testScore = score([1, 1, 2, 3, 5]);
			const sut = () => isScoreApplicableToField(testScore, 'smallStraight');

			// Act
			const result = sut();

			// Assert
			assert.strictEqual(result, false);
		})

        for(let score of allowedScores) {
            await testContext.test(`validTheory ${score}`, () => {

                // Arrange
                const sut = () => isScoreApplicableToField(score, 'smallStraight');

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, true);
            })
        }

        for(let score of disallowedScores) {
            await testContext.test(`inValidTheory ${score}`, () => {

                // Arrange
                const sut = () => isScoreApplicableToField(score, 'smallStraight');

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, false);
            })
        }
    })
});