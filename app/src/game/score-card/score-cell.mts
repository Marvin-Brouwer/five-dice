import { cssClass } from '@rooted/components'

import type { RenderContext } from '../../_shared/render-context.ts'

import styles from './score-table.css'

/** Shown instead of a number when a cell has no score yet. */
export const emptyScoreMark = '.'

export type ScoreCellOptions = {
	/** Already-formatted cell text — a number, `emptyScoreMark`, or '' when discarded. */
	text: string
	/** Whether this is a real score, which switches to the handwritten face. */
	applied: boolean
	/** Column class, so the same cell works in a 3-column and a 2-column table. */
	column: 'score' | 'totals'
}

/** The numeric `<td>` of a row. */
export function scoreCell(context: RenderContext, options: ScoreCellOptions): HTMLTableCellElement {
	const { element } = context
	const { text, applied, column } = options

	return element('td', {
		classes: column === 'totals' ? styles.totalsColumn : styles.scoreColumn,
		children: element('span', {
			classes: [
				styles.scoreValue,
				cssClass(text === emptyScoreMark || text === '/', styles.scoreValueMark),
				cssClass(applied, styles.scoreValueFilled),
			],
			textContent: text,
		}),
	})
}
