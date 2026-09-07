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

/**
 * Rows still open for a roll. Which rows the picker offers never depends on
 * the roll -- only each row's variant does -- so this can be answered before
 * a roll exists, which is what lets the keypad scroll them into view.
 */
export function openRowFields(pad: ReadonlyState<ScorePad>): ScoreField[] {
	return scoreFieldOrder.filter((field) => {
		const cell = pad[field]
		// The flush slot is special: discarded means done, but an existing
		// entry does not -- a later flush stacks onto it, at the cost of
		// sacrificing another row.
		if (field === 'flush') return cell === undefined || !isDiscarded(cell)
		return cell === undefined
	})
}

/** Rows a roll can still be entered into, valid ones and discards alike. */
export function availableRowFields(pad: ReadonlyState<ScorePad>, dice: ReadonlyState<DiceTuple>): RowOverlayField[] {
	const scoreValue = score(dice)

	return openRowFields(pad).map((field) => {
		const applicable = isScoreApplicableToField(scoreValue, field)
		return {
			field,
			variant: applicable ? 'valid' : 'discard',
			// The card renders this through its normal row renderer, so the
			// score text, the dice and the flush badge all come out of the
			// same code path as the committed row. A row that isn't
			// applicable previews as an actual discard.
			previewCell: applicable ? projectedCell(pad, field, scoreValue) : discard(),
		}
	})
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
