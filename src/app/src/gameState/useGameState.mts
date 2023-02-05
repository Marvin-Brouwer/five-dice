import { createSignal } from 'solid-js';
import type { Accessor } from "solid-js";

import { advance, applyRound, createGameState, isFinishedGameState, startGame } from "./gameState.mjs";
import type { ActiveGameState, FinishedGameState, GameConfig, GameState, PendingGameState, PlayerRoundApplication } from "./gameState.mjs";
import { discardedScore } from './gameScore.mjs';

export type GameStateAccessor =  Accessor<Readonly<GameState>>;
export type GameStateSetter = {
    applyScore: (score: PlayerRoundApplication) => void
};

type GameStateHook = [state: GameStateAccessor, stateSetter: GameStateSetter];

export type GameSocket = {
    onGameStart: (handler: (gameState: PendingGameState) => void) => void
    onAdvance: (handler: (gameState: ActiveGameState) => void) => void

    advance: (gameState: ActiveGameState) => void
    sendGameEnd: (gameState: FinishedGameState) => void
}

export function useGameState(gameConfig: GameConfig, socket: GameSocket): GameStateHook {

    const [currentGameState, setGameState] = createSignal<GameState>(createGameState(gameConfig));

    socket.onGameStart((state) => {
        setGameState(startGame(state))
    })

    socket.onAdvance((state) => {
        setGameState(advance(state))

        if (isFinishedGameState(state)) 
            socket.sendGameEnd(state);
    })

    const gameStateSetter: GameStateSetter = {
        applyScore(application) {
            setGameState(state => applyRound(state as ActiveGameState, application))
        }
    };
    return [currentGameState, gameStateSetter];
}