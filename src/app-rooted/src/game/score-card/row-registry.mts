import type { ScoreField } from '../_logic/gameConstants.ts'

export type RowRegistry = {
	set(field: ScoreField, row: HTMLElement): void
	delete(field: ScoreField): void
	/** Viewport rect of a row, for positioning the overlay's hit targets. */
	rect(field: ScoreField): DOMRect | undefined
	/**
	 * The vertical viewport band a set of rows covers together, for scrolling
	 * them into view. Undefined when none of them are on screen.
	 */
	span(fields: Iterable<ScoreField>): RowSpan | undefined
}

export type RowSpan = {
	top: number
	bottom: number
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

	function rect(field: ScoreField): DOMRect | undefined {
		const row = rows.get(field)
		if (!row?.isConnected) return undefined
		return row.getBoundingClientRect()
	}

	return {
		set(field, row) { rows.set(field, row) },
		delete(field) { rows.delete(field) },
		rect,
		span(fields) {
			let top = Number.POSITIVE_INFINITY
			let bottom = Number.NEGATIVE_INFINITY
			for (const field of fields) {
				const box = rect(field)
				if (box === undefined) continue
				top = Math.min(top, box.top)
				bottom = Math.max(bottom, box.bottom)
			}
			if (top === Number.POSITIVE_INFINITY) return undefined
			return { top, bottom }
		},
	}
}
