import type { ScoreField } from '../logic/gameConstants.ts'
import type { PreviewCell, SelectionStore } from '../score-card/selection-store.mts'

export type RowPreviewArbiter = {
	/** Record what a row would become if picked. Replaces the previous set. */
	setCells(cells: Map<ScoreField, PreviewCell | undefined>): void
	setHovered(field: ScoreField | undefined): void
	setFocused(field: ScoreField | undefined): void
	/** Drop `field` from hover, if that is what it currently is. */
	clearHovered(field: ScoreField): void
	/** Drop `field` from focus, if that is what it currently is. */
	clearFocused(field: ScoreField): void
	/** Push the winning row to the selection store. */
	sync(): void
	/** Forget everything. Does not write to the selection store. */
	reset(): void
}

export type RowPreviewArbiterOptions = {
	selection: SelectionStore
	/** The row whose radio is checked, the fallback when nothing hovers or has focus. */
	selectedField: () => ScoreField | undefined
	/** False once the overlay is closing, which makes `sync` a no-op. */
	isShown: () => boolean
	/** Run after each sync, once the card has re-rendered. */
	onSynced: () => void
}

/**
 * Decides which row the picker is previewing, and writes it to the selection
 * store.
 *
 * The overlay proposes; the score card renders. Nothing here touches the
 * card's DOM.
 */
export function createRowPreviewArbiter({
	selection,
	selectedField,
	isShown,
	onSynced,
}: RowPreviewArbiterOptions): RowPreviewArbiter {
	/**
	 * What each row would become, by field, so the preview can be rebuilt
	 * from whichever row is current without the event that asked for it
	 * having to carry the cell along.
	 */
	let cells = new Map<ScoreField, PreviewCell | undefined>()
	let hoveredField: ScoreField | undefined
	let focusedField: ScoreField | undefined

	/**
	 * The row the preview belongs to: what the pointer is over, else what
	 * holds keyboard focus, else whatever is actually checked.
	 *
	 * The checked row is the load-bearing fallback. Safari does not focus
	 * a radio when its label is tapped, so on iOS the first tap fires
	 * `mouseenter` on the tapped label and then blurs the radio the dialog
	 * autofocused, with no `focus` on the tapped one to follow. Keyed to
	 * hover and focus alone, that blur wiped the preview the tap had just
	 * set and the row fell back to its empty rendering -- a bare `.` where
	 * the dice belong -- until the next tap. Chrome focuses the radio, so
	 * it never showed there.
	 */
	function previewField(): ScoreField | undefined {
		return hoveredField ?? focusedField ?? selectedField()
	}

	function sync() {
		// Teardown blurs a radio as the dialog closes; that must not write
		// selection state back after this overlay has handed it over.
		if (!isShown()) return
		const field = previewField()
		const previewCell = field === undefined ? undefined : cells.get(field)
		selection.setHover(field)
		if (field !== undefined && previewCell !== undefined) selection.setPreview(field, previewCell)
		else selection.clearPreview()
		onSynced()
	}

	return {
		setCells(next) {
			cells = next
			hoveredField = undefined
			focusedField = undefined
		},
		setHovered(field) {
			hoveredField = field
		},
		setFocused(field) {
			focusedField = field
		},
		clearHovered(field) {
			if (hoveredField === field) hoveredField = undefined
		},
		clearFocused(field) {
			if (focusedField === field) focusedField = undefined
		},
		sync,
		reset() {
			cells = new Map()
			hoveredField = undefined
			focusedField = undefined
		},
	}
}
