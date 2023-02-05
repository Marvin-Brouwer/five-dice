/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { createGameState, GameConfig } from '../../gameState/gameState.mjs';
import { roundAmount } from '../../gameState/gameConstants.mjs';

describe('gameState', () => {

    test(`createGameState should create valid not-started`, () => {

        // Arrange
        const sut = createGameState;
        const config: GameConfig = {
            playerId: 123,
            players: new Set([123, 456]),
            trace: true
        }

        // Act
        const result = sut(config);

        // Assert
        assert.strictEqual(result.gameStarted, false);
        assert.strictEqual(result.rounds.length, roundAmount); // 13 game rounds
        assert.deepEqual(Array.from(Object.keys(result.rounds[0])), [123, 456]); // 2 players

    })
});