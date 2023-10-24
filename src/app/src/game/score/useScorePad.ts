import { createSignal, Accessor } from 'solid-js'
import { ScorePad, createScorePad } from './scorePad'
import { ScoreApplication, applyScore } from './scoreApplicationProcessor'

export type ScorePadAccessor =  Accessor<Readonly<ScorePad>>;
export type ScorePadModifier = (score: ScoreApplication) => (Readonly<ScorePad> | void)

export type ScorePadSignal = [state: ScorePadAccessor, stateSetter: ScorePadModifier];

export function useScorePad(): ScorePadSignal {

	const [currentScorePad, setScorePad] = createSignal<ScorePad>(createScorePad())
    
	function modifyScorePad(application: ScoreApplication) {
		setScorePad(state => {
			const test = applyScore(state, application)
			console.log('currentScore', test)
			return test
		})
	}
	return [currentScorePad, modifyScorePad]
}