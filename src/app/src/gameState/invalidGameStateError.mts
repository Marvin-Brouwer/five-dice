import type { GameState } from "./gameState.mjs";

export class InvalidGameStateError extends Error {

    public static gameAlreadyStarted(gameState: GameState): InvalidGameStateError {
        return new InvalidGameStateError ("game already started", gameState);
    }

    public static gameNotStarted(gameState: GameState): InvalidGameStateError {
        return new InvalidGameStateError ("game not started", gameState);
    }
    
    private constructor (public reason: string, public gameState: GameState) {
        super(`The game is in invalid state, reason: ${reason}`);
    }
}