import type { ReadonlyState } from '@rooted/store'

import { scoreFieldOrder } from '../_logic/fields.ts'
import type { DiceTuple, ScoreField } from '../_logic/gameConstants.ts'
import { discard, isDiscarded, score } from '../_logic/score/score.ts'
import { isScoreApplicableToField } from '../_logic/score/scoreFieldValidator.ts'
import type { ScorePad } from '../_logic/score/scorePad.ts'
import { flushEntries, projectedCell } from '../_logic/score/scoreProjection.ts'

import type { RowOverlayField } from './row-overlay.mts'

/**
 * Which rows the pickers offer, and what each would look like if chosen.
 *
 * Pure functions over the pad so they can be tested without a DOM — the
 * component only decides *when* to ask.
 */

/** Rows a roll can still be entered into, valid ones and discards alike. */
export function availableRowFields(pad: ReadonlyState<ScorePad>, dice: ReadonlyState<DiceTuple>): RowOverlayField[] {
	const scoreValue = score(dice)
	const result: RowOverlayField[] = []

	for (const field of scoreFieldOrder) {
		const cell = pad[field]
		if (field === 'flush') {
			// The flush slot is special: discarded means done, but an existing
			// entry does not -- a later flush stacks onto it, at the cost of
			// sacrificing another row.
			if (cell !== undefined && isDiscarded(cell)) continue
		}
		else if (cell !== undefined) {
			continue
		}

		const applicable = isScoreApplicableToField(scoreValue, field)
		result.push({
			field,
			variant: applicable ? 'valid' : 'discard',
			// The card renders this through its normal row renderer, so the
			// score text, the dice and the flush badge all come out of the
			// same code path as the committed row. A row that isn't
			// applicable previews as an actual discard.
			previewCell: applicable ? projectedCell(pad, field, scoreValue) : discard(),
		})
	}

	return result
}

/** Rows that can be sacrificed to make room for a second or later flush. */
export function flushDiscardFields(pad: ReadonlyState<ScorePad>): RowOverlayField[] {
	return scoreFieldOrder
		.filter(field => field !== 'flush' && pad[field] === undefined)
		.map(field => ({ field, variant: 'discard' as const, previewCell: discard() }))
}

/** A second or later flush has to sacrifice another row. */
export function flushNeedsDiscard(pad: ReadonlyState<ScorePad>): boolean {
	return flushEntries(pad).length > 0
}
