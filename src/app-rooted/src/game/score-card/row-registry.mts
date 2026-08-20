import type { ScoreField } from '../_logic/gameConstants.ts'

export type RowRegistry = {
	set(field: ScoreField, row: HTMLElement): void
	delete(field: ScoreField): void
	/** Viewport rect of a row, for positioning the overlay's hit targets. */
	rect(field: ScoreField): DOMRect | undefined
}

/**
 * Where each field's `<tr>` currently lives.
 *
 * Deliberately not a store: `createStore` deep-clones and deep-freezes on
 * read, and live DOM elements must not go through that. The score card
 * publishes its rows here so the row overlay can position itself without
 * querying the card's DOM.
 */
export function createRowRegistry(): RowRegistry {
	const rows = new Map<ScoreField, HTMLElement>()

	return {
		set(field, row) { rows.set(field, row) },
		delete(field) { rows.delete(field) },
		rect(field) {
			const row = rows.get(field)
			if (!row?.isConnected) return undefined
			return row.getBoundingClientRect()
		},
	}
}
