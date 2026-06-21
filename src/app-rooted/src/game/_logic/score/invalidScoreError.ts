import type { ScoreField } from '../gameConstants'
import type { ScoreContainer } from './score'

export class InvalidScoreError extends Error {
    
	public static normalScoreCannotBeArray(score: ScoreContainer, field: ScoreField) {
		const message = `field '${field}' cannot be an array, this is only reserved for 'flush'`
		return new InvalidScoreError(message, score, field)
	}
	public static flushCannotBeNormalScore(score: ScoreContainer) {
		const message = 'field \'flush\' only accepts arrays'
		return new InvalidScoreError(message, score, 'flush')
	}
    
	private constructor (
		message: string, 
        public score: ScoreContainer, 
        public field: ScoreField
	) {
		super(message)
	}
}