import { cssClass, type CssClass } from '@rooted/components'
import type { ReadonlyState } from '@rooted/store'

import type { ScoreField } from '../_logic/gameConstants.ts'
import { isDiscarded } from '../_logic/score/score.ts'
import { calculateScoreForPad } from '../_logic/score/scoreCalculator.ts'
import type { ScorePad } from '../_logic/score/scorePad.ts'
import type { RenderContext } from '../../_shared/render-context.ts'

import { labelCell, labelDisplay, type ScoreDescription } from './label-cell.mts'
import { renderRollCell } from './roll-cell.mts'
import { emptyScoreMark, scoreCell } from './score-cell.mts'
import styles from './score-table.css'

/**
 * Rows are render functions rather than components on purpose: a component
 * host between `<tbody>` and `<tr>` drops every row out of the accessibility
 * tree. See docs/table-components-in-rooted.md.
 */

type RowFacts = {
	scoreText: string
	discarded: boolean
	applied: boolean
}

function readCell(pad: ReadonlyState<ScorePad>, field: ScoreField): RowFacts {
	const cell = pad[field]
	if (cell === undefined) return { scoreText: emptyScoreMark, discarded: false, applied: false }
	// Discarded rows leave the cells empty; the slash across the row is the
	// entire affordance.
	if (isDiscarded(cell)) return { scoreText: '', discarded: true, applied: false }

	const value = calculateScoreForPad(pad, field)
	return {
		scoreText: value === 0 ? emptyScoreMark : String(value),
		discarded: false,
		applied: value !== 0,
	}
}

export type ScoreRowOptions = {
	field: ScoreField
	pad: ReadonlyState<ScorePad>
	/** Part one rows carry a die face beside the title. */
	withDieIcon: boolean
}

/** One three-column score row: label, roll, score. */
export function scoreRow(context: RenderContext, options: ScoreRowOptions): HTMLTableRowElement {
	const { element } = context
	const { field, pad, withDieIcon } = options
	const { scoreText, discarded, applied } = readCell(pad, field)

	const row = element('tr', {
		classes: [
			styles.rowDisplay,
			cssClass(styles.discarded, discarded),
			cssClass(styles.rowApplied, applied),
		],
		children: [
			labelCell(context, field, withDieIcon),
			element('td', {
				classes: styles.rollColumn,
				children: renderRollCell(context, field, pad[field]),
			}),
			scoreCell(context, { text: scoreText, applied, column: 'score' }),
		],
	})
	// Read by row-overlay to find and decorate this row.
	row.dataset.field = field
	return row
}

export type TotalsRowOptions = {
	title: string
	description?: ScoreDescription
	value: number
	extraClass?: CssClass
}

/** One two-column totals row: label, value. Shares the row chrome above. */
export function totalsRow(context: RenderContext, options: TotalsRowOptions): HTMLTableRowElement {
	const { element } = context
	const { title, description, value, extraClass } = options
	const text = value === 0 ? emptyScoreMark : String(value)

	return element('tr', {
		classes: [styles.rowDisplay, extraClass],
		children: [
			element('td', {
				classes: styles.labelColumn,
				children: labelDisplay(context, title, description),
			}),
			scoreCell(context, { text, applied: value !== 0, column: 'totals' }),
		],
	})
}
