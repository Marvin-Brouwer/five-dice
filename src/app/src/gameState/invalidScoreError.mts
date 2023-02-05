import type { GameState, PlayerRoundApplication } from "./gameState.mjs";

export class InvalidScoreError extends Error {
    
    public static invalidScore(application: PlayerRoundApplication, gameState: GameState) {
        const message = `the attempted score [${application.score.join('')}] is not valid for field '${application.field}`;
        return new InvalidScoreError(message, application, gameState);
    }
    public static noDiscardOnFlush(application: PlayerRoundApplication, gameState: GameState) {
        const message = `when applying for a flush, a discard is required`;
        return new InvalidScoreError(message, application, gameState);
    }
    public static scoreAlreadyApplied(application: PlayerRoundApplication, gameState: GameState) {
        const message = `the attempted score [${application.score.join('')}] for field '${application.field} ` + 
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