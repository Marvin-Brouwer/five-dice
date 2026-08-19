import { createStore, type Store } from '@rooted/store'

import { roundAmount } from './gameConstants.ts'
import { type ScoreApplication, applyScore } from './score/scoreApplicationProcessor.ts'
import { createScorePad, type ScorePad } from './score/scorePad.ts'

export type GameState = {
	pad: ScorePad
	undoPad: ScorePad | undefined
	round: number
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
		store.update(state => {
			state.undoPad = state.pad
			state.pad = nextPad
			state.round = current.round + 1
		})
	}

	function undo() {
		const current = store.value
		if (!current.undoPad) return
		store.update(state => {
			state.pad = state.undoPad!
			state.undoPad = undefined
			state.round = Math.max(1, current.round - 1)
		})
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

/**
 * App-wide singleton, not a per-mount instance: `Game` is rebuilt by the
 * router on every navigation (including a pure locale-segment change from
 * the language switcher), so a store created inside its `onMount` would
 * reset progress on every revisit. Module scope keeps it alive for the
 * whole session, same as `playerNameStore`/`menuStore`/`themeStore`.
 */
export const scorePadStore = createScorePadStore()
