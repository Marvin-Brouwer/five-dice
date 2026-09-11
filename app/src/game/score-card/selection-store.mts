import { createStore, type ReadonlyState, type Store } from '@rooted/store'

import type { ScoreField } from '../logic/gameConstants.ts'
import type { ScorePad } from '../logic/score/scorePad.ts'

/**
 * The projected value a cell would hold if the hovered row were committed.
 * Readonly because it is only ever read back out of the store, and the store
 * hands out deep-frozen snapshots.
 */
export type PreviewCell = ReadonlyState<ScorePad[ScoreField]>

/** How a single row would resolve if confirmed. */
export type RowVariant = 'valid' | 'discard'

/** Which picker is open: choosing where a roll goes, or what to sacrifice. */
export type SelectionMode = 'apply' | 'discard'

export type RowPreview = {
	field: ScoreField
	/** Exactly what the pad cell would hold after apply. */
	cell: PreviewCell
}

export type SelectionState = {
	/** Which picker is open, if any. Drives `data-selecting` on the card. */
	mode: 'none' | SelectionMode
	/** Which rows are selectable, and how each would resolve. */
	targets: Partial<Record<ScoreField, RowVariant>>
	hover: ScoreField | undefined
	/** Follows the pointer: what the row under it would become. */
	preview: RowPreview | undefined
	/**
	 * Shown for the whole step, regardless of the pointer. The flush-discard
	 * step uses it to show the flush that is about to be committed while the
	 * user picks which row to sacrifice for it.
	 */
	pinned: RowPreview | undefined
}

export type SelectionStore = Store<SelectionState> & {
	begin(
		mode: SelectionMode,
		targets: Partial<Record<ScoreField, RowVariant>>,
		pinned?: RowPreview,
	): void
	setHover(field: ScoreField | undefined): void
	setPreview(field: ScoreField, cell: PreviewCell): void
	clearPreview(): void
	end(): void
}

function idleState(): SelectionState {
	return {
		mode: 'none',
		targets: {},
		hover: undefined,
		preview: undefined,
		pinned: undefined,
	}
}

/**
 * What the row picker is currently proposing, as data.
 *
 * The overlay writes; the score card reads and renders. Nothing here is
 * committed state — `end()` must always restore the card to a pure pad
 * render, which is what makes cleanup of injected DOM unnecessary.
 */
export function createSelectionStore(): SelectionStore {
	const store = createStore<SelectionState>(idleState())

	function begin(
		mode: SelectionMode,
		targets: Partial<Record<ScoreField, RowVariant>>,
		pinned?: RowPreview,
	) {
		store.update(() => ({
			mode,
			targets,
			hover: undefined,
			preview: undefined,
			pinned,
		}))
	}

	function setHover(field: ScoreField | undefined) {
		store.update(state => {
			state.hover = field
		})
	}

	function setPreview(field: ScoreField, cell: PreviewCell) {
		store.update(state => {
			state.preview = {
				field,
				cell,
			}
		})
	}

	function clearPreview() {
		store.update(state => {
			state.preview = undefined
		})
	}

	function end() {
		store.update(() => idleState())
	}

	return Object.assign(store, {
		begin,
		setHover,
		setPreview,
		clearPreview,
		end,
	})
}
