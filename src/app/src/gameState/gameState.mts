
import type { Accessor } from "solid-js";
import { createSignal } from 'solid-js';
import type { Score, ScoreField, ScoreFields, ValidScore } from "./gameScore.mjs";
import { InvalidGameStateError } from './invalidGameStateError';

export type GameConfig = {
    players: ReadonlySet<number>
    playerId: Readonly<number>
}

export type GameStateAccessor =  Accessor<GameState>
export type GameStateSetter = {
    applyScore: (score: Score, field: ScoreField) => void
}

type GameStateHook = [state: GameStateAccessor, stateSetter: GameStateSetter]

export type GameState =  {
    config:Readonly<GameConfig>
    gameStarted: boolean
    currentPlayersTurn: boolean
    currentRound: undefined | number

    rounds: {
        [round: number]: Record<keyof GameConfig['players'], Round | undefined>
    }
}

export type Round = {
    score: ValidScore,
    field: ScoreField,
    fields: ScoreFields
}

export type GameSocket = {
    onGameStart: (handler: () => void) => void
    onNextTurn: (handler: (previousTurn: number) => void) => void

    sendNextTurn: (config: GameConfig) => void
    sendGameEnd: () => void
}

export function useGameState(config: GameConfig, socket: GameSocket): GameStateHook {

    const players = Array.from(config.players);
    const [currentGameState, setGameState] = createSignal<GameState>({
        config,
        gameStarted: false,
        currentPlayersTurn: false,
        currentRound: undefined,

        rounds: new Array(12).fill(
            players.reduce(((p, player) => ({ ...p, [player]: undefined })), { })
        )
    });
    const changeGameState = (stateOverride: Partial<GameState>) => {
        setGameState(prev => ({
            ... prev,
            ... stateOverride
        }))
    };

    socket.onGameStart(() => {
        if (currentGameState().gameStarted)
            throw InvalidGameStateError.gameAlreadyStarted(currentGameState());

            changeGameState({
                gameStarted: true,
                currentPlayersTurn: config.playerId == players[0],
                currentRound: 1
            });
    })

    socket.onNextTurn((previousTurn) => {
        if (!currentGameState().gameStarted)
            throw InvalidGameStateError.gameNotStarted(currentGameState());

        const previousPlayerIndex = players.indexOf(previousTurn);
        const nextPlayerIndex = previousPlayerIndex +1;

        if (nextPlayerIndex < players.length) {
            changeGameState({
                currentPlayersTurn: config.playerId == players[nextPlayerIndex]
            });
            return;
        }
        if (currentGameState().currentRound! < 2) {
            setGameState(prev => ({
                ... prev,
                currentPlayersTurn: config.playerId == players[nextPlayerIndex],
                currentRound: (prev.currentRound! +1 as 0 | 1 | 2)
            }))
        }

        const isLastPlayer = currentGameState().config.playerId == players.reverse()[0]
        setGameState(prev => ({
            ... prev,
            currentPlayersTurn: config.playerId == players[nextPlayerIndex],
            currentRound: undefined,
            // end the game if last player
            gameStarted: !isLastPlayer
        }))

        if (isLastPlayer) socket.sendGameEnd();
    })

    const gameStateSetter: GameStateSetter = {
        applyScore(score, field) {
            if (!currentGameState().currentPlayersTurn)
            throw InvalidGameStateError.gameNotStarted(currentGameState());

            // todo validate gamescore
            // todo update game score
            // todo implement rounds
            socket.sendNextTurn(config)
        }
    };
    return [currentGameState, gameStateSetter];
}