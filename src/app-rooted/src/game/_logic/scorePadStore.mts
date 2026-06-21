import { createStore, type Store } from '@rooted/store'

import { roundAmount } from './gameConstants.ts'
import { type ScoreApplication, applyScore } from './score/scoreApplicationProcessor.ts'
import { createScorePad, type ScorePad } from './score/scorePad.ts'

export type GameState = {
	pad: Readonly<ScorePad>
	undoPad: Readonly<ScorePad> | undefined
	round: number
}

function cloneScorePad(pad: Readonly<ScorePad>): Readonly<ScorePad> {
	return Object.assign({}, pad)
}

function initialState(): GameState {
	return {
		pad: createScorePad(),
		undoPad: undefined,
		round: 1,
	}
}

export type ScorePadStore = Store<GameState> & {
	apply(application: ScoreApplication): void
	undo(): void
	canUndo(): boolean
	gameEnded(): boolean
	reset(): void
}

export function createScorePadStore(): ScorePadStore {
	const store = createStore<GameState>(initialState())

	function apply(application: ScoreApplication) {
		const current = store.value
		const nextPad = applyScore(current.pad, application)
		store.update(() => ({
			pad: nextPad,
			undoPad: cloneScorePad(current.pad),
			round: current.round + 1,
		}))
	}

	function undo() {
		const current = store.value
		if (!current.undoPad) return
		store.update(() => ({
			pad: cloneScorePad(current.undoPad!),
			undoPad: undefined,
			round: Math.max(1, current.round - 1),
		}))
	}

	function canUndo() {
		return store.value.undoPad !== undefined
	}

	function gameEnded() {
		return store.value.round > roundAmount
	}

	function reset() {
		store.update(() => initialState())
	}

	return Object.assign(store, { apply, undo, canUndo, gameEnded, reset })
}
