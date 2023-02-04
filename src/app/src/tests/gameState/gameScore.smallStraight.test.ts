/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { scoreValidator } from '../../gameState/gameScore.mjs';
import { generateScores } from './gameScore.test.mjs';

const [pattern, allowedScores, disallowedScores] = generateScores(

    (a, b, c, d, e) => [a, b, c, d, e],

    (a, b, c, d) => [a, b, c, d, d],
    (a, b, c, d) => [d, a, b, c, d],
    (a, b, c, d) => [d, d, a, b, c],
    (a, b, c, d) => [c, d, d, a, b],
    (a, b, c, d) => [b, c, d, d, a],
    (a, b, c, d) => [a, b, c, d, c],
    (a, b, c, d) => [a, b, c, d, b],
    (a, b, c, d) => [a, b, c, d, a],
    (a, b, c, d) => [a, b, c, b, d],
    (a, b, c, d) => [d, a, b, c, b],
    (a, b, c, d) => [b, d, a, b, c],
    (a, b, c, d) => [c, b, d, a, b],
    (a, b, c, d) => [b, c, b, d, a],
    (a, b, c, d) => [a, c, b, d, a],
);

describe('scoreValidator', () => {

    test(`smallStraight ${pattern}`, async testContext => {

        for(let score of allowedScores) {
            await testContext.test(`validTheory [${score.join('')}]`, () => {

                // Arrange
                const sut = () => scoreValidator(score, 'smallStraight');

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, true);
            })
        }

        for(let score of disallowedScores) {
            await testContext.test(`inValidTheory [${score.join('')}]`, () => {

                // Arrange
                const sut = () => scoreValidator(score, 'smallStraight');

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, false);
            })
        }
    })
});