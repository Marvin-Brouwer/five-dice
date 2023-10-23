/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { expect, test, describe } from 'vitest'

import { isScoreApplicableToField } from '../../src/game/score/scoreFieldValidator';
import { generateRandomScores } from './gameScore.mjs';
import { score } from '../../src/game/score/score';

const [pattern, allowedScores, disallowedScores] = generateRandomScores(
    '1234a', '2345a', '3456a', '12345', '23456'
);

describe('scoreValidator', () => {

    describe(`test-cases`, () => {

		test.concurrent(`79-incorrect-small-straight [11235]`, () => {

			// Arrange
			const testScore = score([1, 1, 2, 3, 5]);
			const sut = () => isScoreApplicableToField(testScore, 'smallStraight');

			// Act
			const result = sut();

			// Assert
			expect(result).toBeFalsy();
		})
	})

    test(`smallStraight ${pattern}`, () => {

        for(let score of allowedScores) {
            test.concurrent(`validTheory ${score}`, () => {

                // Arrange
                const sut = () => isScoreApplicableToField(score, 'smallStraight');

                // Act
                const result = sut();

                // Assert
                expect(result).toBeTruthy()
            })
        }

        for(let score of disallowedScores) {
            test.concurrent(`inValidTheory ${score}`, () => {

                // Arrange
                const sut = () => isScoreApplicableToField(score, 'smallStraight');

                // Act
                const result = sut();

                // Assert
               expect(result).toBeFalsy()
            })
        }
    })
});