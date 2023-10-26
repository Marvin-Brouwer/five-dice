import { createSignal, Accessor, createMemo } from 'solid-js'
import { ScorePad, createScorePad } from './scorePad'
import { ScoreApplication, applyScore } from './scoreApplicationProcessor'

export type ScorePadAccessor =  Accessor<Readonly<ScorePad>>;
export type ScorePadModifier = (score: ScoreApplication) => (Readonly<ScorePad> | void)

export type ScorePadSignal = {
	getScorePad: ScorePadAccessor, applyScore: ScorePadModifier,
	canUndoScore: Accessor<boolean>, undoScore: () => void
};

export function useScorePad(): ScorePadSignal {

	const [getUndoState, setUndoState] = createSignal<ScorePad | undefined>(undefined)
	const [currentScorePad, setScorePad] = createSignal<ScorePad>(createScorePad())

	function modifyScorePad(application: ScoreApplication) {
		setUndoState(cloneScorePad(currentScorePad()))
		setScorePad(state => applyScore(state, application))
	}

	const canUndoScore = createMemo(() => getUndoState() !== undefined, getUndoState)
	function undoScore() {
		const newScore = cloneScorePad(getUndoState()!)
		console.log('undo', newScore)
		setScorePad(newScore)
		setUndoState(undefined)
	}

	return { getScorePad: currentScorePad, applyScore: modifyScorePad, canUndoScore, undoScore }
}

function cloneScorePad(scorePad: Readonly<ScorePad>): Readonly<ScorePad> {

	return Object.assign({},  scorePad)
}