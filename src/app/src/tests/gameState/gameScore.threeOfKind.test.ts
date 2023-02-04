/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { scoreValidator } from '../../gameState/gameScore.mjs';
import { generateScores } from './gameScore.test.mjs';

const [pattern, allowedScores, disallowedScores] = generateScores(
    
    (a, b, c) => [a, a, a, b, c],
    (a, b, c) => [c, a, a, a, b],
    (a, b, c) => [b, c, a, a, a],
    (a, b, c) => [a, b, c, a, a],
    (a, b, c) => [a, a, b, c, a],
    (a, b, c) => [a, a, b, a, c],
    (a, b, c) => [c, a, a, b, a],
    (a, b, c) => [a, c, a, a, b],
    (a, b, c) => [b, a, c, a, a],
    (a, b, c) => [a, b, a, c, a],
    
    (a, b) => [a, a, a, b, b],
    (a, b) => [b, a, a, a, b],
    (a, b) => [b, b, a, a, a],
    (a, b) => [a, b, b, a, a],
    (a, b) => [a, a, b, b, a],
    (a, b) => [a, a, b, a, b],
    (a, b) => [b, a, a, b, a],
    (a, b) => [a, b, a, a, b],
    (a, b) => [b, a, b, a, a],
    (a, b) => [a, b, a, b, a],
    
    (a, b) => [a, a, a, a, b],
    (a, b) => [b, a, a, a, a],
    (a, b) => [a, b, a, a, a],
    (a, b) => [a, a, b, a, a],
    (a, b) => [a, a, a, b, a],
    (a, b) => [a, a, a, a, b],

    (a) => [a, a, a, a, a],
);

describe('scoreValidator', () => {

    test(`threeOfKind ${pattern}`, async testContext => {

        for(let score of allowedScores) {
            await testContext.test(`validTheory [${score.join('')}]`, () => {

                // Arrange
                const sut = () => scoreValidator(score, 'threeOfKind');

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, true);
            })
        }

        for(let score of disallowedScores) {
            await testContext.test(`inValidTheory [${score.join('')}]`, () => {

                // Arrange
                const sut = () => scoreValidator(score, 'threeOfKind');

                // Act
                const result = sut();

                // Assert
                assert.strictEqual(result, false);
            })
        }
    })
});