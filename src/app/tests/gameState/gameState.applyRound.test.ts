/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { applyRound, createGameState, PlayerRoundApplication, startGame } from '../../src/gameState/gameState.mjs';
import { score } from '../../src/gameState/gameScore.mjs';

const initialState = createGameState({
    playerId: 123,
    players: new Set([123, 456]),
    trace: true
});

const startedState = startGame(initialState);

describe('gameState', () => {

    test(`when applyRound given game not started then should throw`, () => {

        // Arrange
        const sut = applyRound;
        const invalidStartedState = { ...initialState, gameStarted: true, currentRound: undefined };

        // Act
        const result1 = sut.bind(undefined, initialState as any, undefined!);
        const result2 = sut.bind(undefined, invalidStartedState as any, undefined!);

        // Assert
        assert.throws(result1)
        assert.throws(result2)
    })

    test(`when applyRound given score invalid then should throw`, () => {

        // Arrange
        const sut = applyRound;
        const invalidApplication: PlayerRoundApplication = {
            field: 'aces', score: score(3, 3, 3, 3, 3)
        };

        // Act
        const result = sut.bind(undefined, startedState, invalidApplication);

        // Assert
        assert.throws(result);
    })

    test(`when applyRound given flush and no discard then should throw`, () => {

        // Arrange
        const sut = applyRound;
        const invalidApplication: PlayerRoundApplication = {
            field: 'flush', score: score(3, 3, 3, 3, 3), discard: undefined!
        };

        // Act
        const result = sut.bind(undefined, startedState, invalidApplication);

        // Assert
        assert.throws(result);
    })

    test(`when applyRound given score valid and score already applied then should throw`, () => {

        // Arrange
        const sut = applyRound;
        const validApplication: PlayerRoundApplication = {
            field: 'threes', score: score(1, 2, 3, 3, 6)
        }
        const testState = applyRound(startedState, validApplication);
        testState.currentRound = 1;
        
        const invalidApplication: PlayerRoundApplication = {
            field: 'threes', score: score(3, 3, 3, 3, 3)
        };

        // Act
        const result = sut.bind(undefined, testState, invalidApplication);

        // Assert
        assert.throws(result);
    })

    test(`when applyRound given score valid then score should be applied`, () => {

        // Arrange
        const sut = applyRound;
        const validApplication: PlayerRoundApplication = {
            field: 'threes', score: score(1, 2, 3, 3, 6)
        }

        // Act
        const result = sut(startedState, validApplication);

        // Assert
        assert.deepEqual(result.rounds[0][123]?.field, 'threes');
        assert.deepEqual(result.rounds[0][123]?.score, score(1, 2, 3, 3, 6));
        assert.deepEqual(result.rounds[0][123]?.fields['threes'], score(1, 2, 3, 3, 6));
    })
});