import { createRowRegistry, type RowRegistry } from '../score-card/row-registry.mts'
import { createSelectionStore, type SelectionStore } from '../score-card/selection-store.mts'

import { scorePadStore, type ScorePadStore } from './scorePadStore.mts'

export type GameContext = {
	/**
	 * The only source of truth for committed game state. An app-wide
	 * singleton — see scorePadStore.mts for why it outlives the page.
	 */
	pad: ScorePadStore
	/** What the row picker is currently proposing. Never persisted. */
	selection: SelectionStore
	/** Field to live `<tr>`, published by the card for the overlay's geometry. */
	rows: RowRegistry
}

/**
 * Rooted has no context or DI, so the state topology is wired by hand: one
 * object built at page mount and handed to the score card and the score
 * input.
 *
 * Committed state (`pad`) is the app-wide singleton so progress survives a
 * remount. The transient members are rebuilt per mount, which is what we
 * want: a half-open row picker must not outlive the page it was drawn over,
 * and `rows` holds live DOM that the previous mount no longer owns.
 */
export function createGameContext(): GameContext {
	return {
		pad: scorePadStore,
		selection: createSelectionStore(),
		rows: createRowRegistry(),
	}
}
