/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { createGameState, GameState, PendingGameState, startGame } from '../../src/gameState/gameState.js';

describe('gameState', () => {

    test(`startGame when game not started should start game`, () => {

        // Arrange
        const sut = startGame;
        const state = createGameState({
            playerId: 123,
            players: new Set([123, 456]),
            trace: true
        });


        // Act
        const result = sut(state);

        // Assert
        assert.strictEqual(result.gameStarted, true);
        assert.strictEqual(result.currentPlayersTurn, true);
    })

    test(`startGame when game already started should throw error`, () => {

        // Arrange
        const sut = startGame;
        const initialState = createGameState({
            playerId: 123,
            players: new Set([123, 456])
        });
        const startedState = startGame(initialState) as GameState as PendingGameState;

        // Act
        const result = sut.bind(undefined, startedState);

        // Assert
        assert.throws(result);
    })
});