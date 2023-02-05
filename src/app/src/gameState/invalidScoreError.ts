import type { DieValue } from "./gameConstants";
import type { GameState, PlayerRoundApplication } from "./gameState";

export class InvalidScoreError extends Error {
    
    public static invalidScore(application: PlayerRoundApplication, gameState: GameState) {
        const message = `the attempted score [${application.score}] is not valid for field '${application.field}'`;
        return new InvalidScoreError(message, application, gameState);
    }
    public static noDiscardOnFlush(application: PlayerRoundApplication, gameState: GameState) {
        const message = `when applying for a 'flush', a discard is required`;
        return new InvalidScoreError(message, application, gameState);
    }
    public static flushDiscarded(application: PlayerRoundApplication, gameState: GameState) {
        const message = `you cannot append values to a 'flush' that is already discarded`;
        return new InvalidScoreError(message, application, gameState);
    }
    public static cannotDiscardFlush(application: PlayerRoundApplication, gameState: GameState) {
        const message = `you cannot discard a flush 'flush' that already has value`;
        return new InvalidScoreError(message, application, gameState);
    }
    public static scoreAlreadyApplied(application: PlayerRoundApplication, gameState: GameState) {
        const message = `the attempted score [${application.score}] for field '${application.field}' ` + 
            `was already applied in a previous round`;
        return new InvalidScoreError(message, application, gameState);
    }
    
    private constructor (
        message: string, 
        public application: PlayerRoundApplication, 
        public gameState: GameState
    ) {
        super(message);
    }
}