import type { GameState } from "./gameState.mjs";

export class InvalidGameStateError extends Error {

    public static gameAlreadyStarted(state: GameState): InvalidGameStateError {
        return new InvalidGameStateError ("game already started", state);
    }

    public static gameNotStarted(state: GameState): InvalidGameStateError {
        return new InvalidGameStateError ("game not started", state);
    }
    
    private constructor (public reason: string, public state: GameState) {
        super(`The game is in invalid state, reason: ${reason}`);
    }
}