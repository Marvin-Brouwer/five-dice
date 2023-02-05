
import { emptyScorePad, roundAmount } from "./gameConstants";
import { ScoreField, ScoreFields, Score, validateScore } from "./gameScore";
import { InvalidGameStateError } from './invalidGameStateError.js';
import { InvalidScoreError } from "./invalidScoreError";

export type GameConfig = {
    players: ReadonlySet<number>
    playerId: Readonly<number>
    trace?: Readonly<boolean>
}

export type PlayerRound = {
    score: Score,
    field: ScoreField,
    fields: ScoreFields
}
export type PlayerRoundApplication = 
    | Pick<PlayerRound, 'score'> & {
        field: Exclude<ScoreField, 'flush'>
    }
    | Pick<PlayerRound, 'score'> & { 
        field: 'flush',
        discard: Exclude<ScoreField, 'flush'>
    }
export type GameRound = Record<number, PlayerRound | undefined>;

export type GameState = PendingGameState | ActiveGameState | FinishedGameState;

type BaseGameState = 
{
    config: () => Required<Readonly<GameConfig>>
    rounds: Array<GameRound>
}

export type PendingGameState = BaseGameState & {
    gameStarted: false
    gameFinished: false
    currentPlayer: undefined
    currentPlayersTurn: false
    currentRound: undefined
};
export type ActiveGameState = BaseGameState & {
    gameStarted: true
    gameFinished: false
    currentPlayer: number
    currentPlayersTurn: boolean
    currentRound: number
};
export type FinishedGameState = BaseGameState & {
    gameStarted: true
    gameFinished: true
    currentPlayer: undefined
    currentPlayersTurn: false
    currentRound: undefined
};

export function isActiveGameState(gameState: GameState): gameState is ActiveGameState {
    if (!gameState.gameStarted) return false;
    if (gameState.gameFinished) return false;
    if (gameState.currentRound === undefined) return false;

    return true;
}
export function isFinishedGameState(gameState: GameState): gameState is FinishedGameState {
    if (!gameState.gameStarted) return false;

    return gameState.gameFinished;
}


export function createGameState(gameConfig: GameConfig): PendingGameState {

    const players = Array.from(gameConfig.players);
    
    const rounds = players.map((player) => (
        [player, undefined] as [number, PlayerRound | undefined] 
    ));

    const config = () => ({
        ...gameConfig,
        trace: gameConfig.trace ?? false
    });
    return {
        config,
        gameStarted: false,
        gameFinished: false,
        currentPlayer: undefined,
        currentPlayersTurn: false,
        currentRound: undefined,

        rounds: new Array(roundAmount).fill(
            Object.fromEntries(rounds)
        )
    }
}

export function startGame(gameState: PendingGameState): ActiveGameState {

    if (isActiveGameState(gameState as GameState)) throw InvalidGameStateError.gameAlreadyStarted(gameState);

    const firstPlayer = gameState.config().players.values().next().value;
    return {
        ...gameState,
        gameStarted: true,
        currentPlayer: firstPlayer,
        currentPlayersTurn: gameState.config().playerId == firstPlayer,
        currentRound: 0
    }
}

export function applyRound(gameState: ActiveGameState, score: PlayerRoundApplication): ActiveGameState {

    if (!isActiveGameState(gameState as GameState)) throw InvalidGameStateError.gameNotStarted(gameState);

    let rounds = gameState.rounds;
    rounds[gameState.currentRound][gameState.currentPlayer] = processRound(gameState, score);

    return {
        ...gameState,
        rounds
    }
}

function processRound(gameState: ActiveGameState, score: PlayerRoundApplication): PlayerRound {

    const previousFields = gameState.currentRound === 0
        ? emptyScorePad
        : gameState.rounds[gameState.currentRound! -1][gameState.currentPlayer]?.fields!;

    if (!validateScore(score.score, score.field)) 
        throw InvalidScoreError.invalidScore(score, gameState);
    
    const fields = {
        ...previousFields,
    };

    if (score.field === 'flush') {
        if (!!!score.discard) 
            throw InvalidScoreError.noDiscardOnFlush(score, gameState);

        fields[score.field].push([score.score, score.discard])
    }
    else {
        if (previousFields[score.field] !== undefined)
            throw InvalidScoreError.scoreAlreadyApplied(score, gameState);

        fields[score.field] = score.score!;
    }

    return  {
        field: score.field,
        score: score.score,
        fields
    };
}

export function advance(gameState: ActiveGameState): ActiveGameState | FinishedGameState {

    if (!isActiveGameState(gameState as GameState)) throw InvalidGameStateError.gameNotStarted(gameState);
    // todo check if players turn everywhere

    const players = Array.from(gameState.config().players);
    gameState.config().trace && console.log('advance', 'gameState', JSON.stringify(gameState))


    if(gameState.currentPlayer !== players.at(-1)) {
        gameState.config().trace && console.log('advance', 'advance player');

        return {
            ...gameState,
            currentPlayer: players[players.indexOf(gameState.currentPlayer) +1],
            currentPlayersTurn: false
        };
    }
    if(gameState.currentRound < roundAmount -1)  {
        gameState.config().trace && console.log('advance', 'advance round');

        return {
            ...gameState,
            currentPlayer: players[0],
            currentPlayersTurn: gameState.config().playerId === players[0],
            currentRound: gameState.currentRound +1
        };
    }

    gameState.config().trace && console.log('advance', 'finish game');
    return {
        config: gameState.config,
        rounds: gameState.rounds,
        gameStarted: true,
        gameFinished: true,
        currentPlayer: undefined,
        currentPlayersTurn: false,
        currentRound: undefined
    };
}