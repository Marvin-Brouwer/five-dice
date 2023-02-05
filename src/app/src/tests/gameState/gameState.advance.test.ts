/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { ActiveGameState, advance, applyRound, createGameState, isFinishedGameState, PlayerRoundApplication, startGame } from '../../gameState/gameState.mjs';
import { score } from '../../gameState/gameScore.mjs';
import { roundAmount } from '../../gameState/gameConstants.mjs';

const initialState = createGameState({
    playerId: 123,
    players: new Set([123, 456]),
    trace: true
});

const startedState = startGame(initialState);

function createLastRoundState(){
    
    let testState = startedState;
    while(testState.currentRound < roundAmount -1)
        testState = advance(testState) as ActiveGameState;
    // advance one more time to advance to last player
    testState = advance(testState)as ActiveGameState;

    return testState;
}

describe('gameState', () => {

    test(`when advance given game not started then should throw`, () => {

        // Arrange
        const sut = advance;
        const invalidStartedState = { ...initialState, gameStarted: true, currentRound: undefined };

        // Act
        const result1 = sut.bind(undefined, initialState as any, undefined!);
        const result2 = sut.bind(undefined, invalidStartedState as any, undefined!);

        // Assert
        assert.throws(result1)
        assert.throws(result2)
    })

    test(`when advance given current player is not last and given round is not last should advance to next player`, () => {

        // Arrange
        const sut = advance;

        // Act
        const result = sut(startedState);

        // Assert
        assert.deepEqual(result.currentRound, 0);
        assert.deepEqual(result.currentPlayer, 456);
    })

    test(`when advance given current player is last and given round is not last should advance to next round`, () => {

        // Arrange
        const sut = advance;
        const testState = advance(startedState) as ActiveGameState;
        testState.currentPlayer = 456;

        // Act
        const result = sut(testState);

        // Assert
        assert.deepEqual(result.currentRound, 1);
        assert.deepEqual(result.currentPlayer, 123);
    })

    test(`when advance given current player is last and given round is last should finish game`, () => {

        // Arrange
        const sut = advance;
        const testState = createLastRoundState();

        // Act
        const result = sut(testState);

        // Assert
        assert.deepEqual(result.gameFinished, true);
        assert.deepEqual(isFinishedGameState(result), true);
    })
});