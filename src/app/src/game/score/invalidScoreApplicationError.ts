import type { ScoreApplication } from './scoreApplicationProcessor'
import type { ScorePad } from './scorePad'

export class InvalidScoreApplicationError extends Error {

	public static invalidScoreApplication(scorePad: Readonly<ScorePad>, application: ScoreApplication) {
		const message = `the attempted score [${application.score}] is not valid for field '${application.field}'`
		return new InvalidScoreApplicationError(message, application, scorePad)
	}
	public static scoreAlreadyApplied(scorePad: Readonly<ScorePad>, application: ScoreApplication) {
		const message = `the attempted score [${application.score}] for field '${application.field}' ` + 
            'was already applied in a previous round'
		return new InvalidScoreApplicationError(message, application, scorePad)
	}
	public static noDiscardOnFlush(scorePad: Readonly<ScorePad>, application: ScoreApplication) {
		const message = 'when applying for multiple \'flush\'s, a discard is required'
		return new InvalidScoreApplicationError(message, application, scorePad)
	}
	public static flushDiscarded(scorePad: Readonly<ScorePad>, application: ScoreApplication) {
		const message = 'you cannot append values to a \'flush\' that is already discarded'
		return new InvalidScoreApplicationError(message, application, scorePad)
	}
	public static cannotDiscardFlush(scorePad: Readonly<ScorePad>, application: ScoreApplication) {
		const message = 'you cannot discard a flush \'flush\' that already has value'
		return new InvalidScoreApplicationError(message, application, scorePad)
	}
    
	private constructor (
		message: string, 
        public application: ScoreApplication, 
        public scorePad: ScorePad
	) {
		super(message)
	}
}