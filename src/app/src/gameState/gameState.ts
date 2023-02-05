
import { isArray } from "xstate/lib/utils";
import { emptyScorePad, roundAmount } from "./gameConstants";
import { ScoreField, ScoreFields, Score, validateScore, isDiscarded, discardedScore, ValidScore, FlushScore, DiscardedScore } from './gameScore';
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
export type PlayerRoundApplication = PlayerRoundFieldApplication | PlayerRoundAppendFlushApplication | PlayerRoundDiscardFlushApplication
export type PlayerRoundFieldApplication = {
    score: Score
    field: ScoreField
}
export type PlayerRoundAppendFlushApplication = { 
    field: 'flush',
    score: FlushScore
}
export type PlayerRoundDiscardFlushApplication = {  
    field: 'flush',
    score: DiscardedScore
}

function isAppendedFlushApplication(application: PlayerRoundApplication): application is PlayerRoundAppendFlushApplication {

    return application.field === 'flush' && !isDiscarded(application.score);
}
function isDiscardedFlushApplication(application: PlayerRoundApplication): application is PlayerRoundDiscardFlushApplication {

    return application.field === 'flush' && isDiscarded(application.score);
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
        ? emptyScorePad()
        : gameState.rounds[gameState.currentRound! -1][gameState.currentPlayer]?.fields!;

    if (!validateScore(score.score, score.field)) 
        throw InvalidScoreError.invalidScore(score, gameState);

    if (isAppendedFlushApplication(score)) {
        return processFlushAppendScore(gameState, previousFields, score);
    }
    if (isDiscardedFlushApplication(score)) {
        return processFlushDiscardScore(gameState, previousFields, score);
    }

    return processNormalScore(gameState, previousFields, score);
}

function processFlushAppendScore(gameState: ActiveGameState, previousFields: ScoreFields, score: PlayerRoundAppendFlushApplication): PlayerRound {

    const fields = { ...previousFields };
        
    const scoreField = fields[score.field];
    // Lock the flush after discarding
    if(isDiscarded(scoreField))
        throw InvalidScoreError.flushDiscarded(score, gameState);

    if (!!!score.score.discardField) 
        throw InvalidScoreError.noDiscardOnFlush(score, gameState);

    scoreField.push(score.score);

    if (fields[score.score.discardField] !== undefined)
        throw InvalidScoreError.scoreAlreadyApplied(score, gameState);

    fields[score.score.discardField] = discardedScore;
;

    return  {
        field: score.field,
        score: score.score,
        fields
    };
}
function processFlushDiscardScore(gameState: ActiveGameState, previousFields: ScoreFields, score: PlayerRoundDiscardFlushApplication): PlayerRound {

    const fields = { ...previousFields };

    if (isDiscarded(previousFields['flush']))
        throw InvalidScoreError.scoreAlreadyApplied(score, gameState);
    if ((previousFields[score.field] as Array<FlushScore>).length != 0)
        throw InvalidScoreError.cannotDiscardFlush(score, gameState);

    (fields[score.field] as Score) = score.score!;

    return  {
        field: score.field,
        score: score.score,
        fields
    };
}
function processNormalScore(gameState: ActiveGameState, previousFields: ScoreFields, score: PlayerRoundFieldApplication): PlayerRound {

    const fields = { ...previousFields };

    if (fields[score.field] !== undefined)
        throw InvalidScoreError.scoreAlreadyApplied(score, gameState);

    (fields[score.field] as Score) = score.score!;


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