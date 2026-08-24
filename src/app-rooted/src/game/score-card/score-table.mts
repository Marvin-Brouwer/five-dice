import type { CssClass } from '@rooted/components'

import type { RenderContext } from '../../_shared/render-context.ts'

import styles from './score-table.css'

/**
 * Table chrome shared by ScoreSection and TotalsTable. Both declare
 * score-table.css as their styles, so they share one CSS scope and these
 * render functions work inside either.
 */

export function tableColumn(context: RenderContext, className: CssClass): HTMLTableColElement {
	return context.element('col', {
		classes: className,
	})
}

export type BandCell = {
	text: string
	classes: CssClass
}

/**
 * The dark section header. One `<td>` spanning the table with a flex row
 * inside, so intra-band edges can't produce sub-pixel artifacts on high-DPI
 * screens.
 */
export function sectionBand(context: RenderContext, cells: BandCell[]): HTMLTableSectionElement {
	const { element } = context

	const bandCell = element('td', {
		classes: styles.sectionName,
		colSpan: cells.length,
		children: element('div', {
			classes: styles.bandInner,
			children: cells.map(cell => element('span', {
				classes: [styles.bandCell, cell.classes],
				textContent: cell.text,
			})),
		}),
	})

	return element('thead', {
		children: element('tr', {
			classes: styles.sectionRow,
			children: bandCell,
		}),
	})
}
