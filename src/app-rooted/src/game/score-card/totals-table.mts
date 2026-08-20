import { component } from '@rooted/components'

import {
	calculateGameTotal,
	calculatePartOneBonus,
	calculatePartOneSubTotal,
	calculatePartTwoTotal,
} from '../_logic/score/scoreCalculator.ts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import type { RenderContext } from '../../_shared/render-context.ts'

import { totalsRow } from './score-row.mts'
import { sectionBand, tableColumn } from './score-table.mts'
import styles from './score-table.css'

export type TotalsTableOptions = {
	store: ScorePadStore
}

/**
 * Subtotals, bonus and final score as a two-column table.
 *
 * Every value is computed from the pad on render — nothing here is cached in a
 * store, so it cannot drift from the committed state.
 */
export const TotalsTable = component<TotalsTableOptions>({
	name: 'totals-table',
	styles,
	onMount({ replace, element, create, signal, options }) {
		const context: RenderContext = { element, create }
		const { store } = options

		const body = element('tbody')

		function render() {
			const pad = store.value.pad
			const partOne = calculatePartOneSubTotal(pad)
			const bonus = calculatePartOneBonus(partOne)
			const partTwo = calculatePartTwoTotal(pad)

			body.replaceChildren(
				totalsRow(context, {
					title: localization.text`Total part 1`,
					value: partOne,
				}),
				totalsRow(context, {
					title: localization.text`Bonus`,
					description: {
						short: localization.text`+35 if part1 ≥ 63`,
						long: localization.text`Adds 35 if part one ≥ 63`,
					},
					value: bonus,
				}),
				totalsRow(context, {
					title: localization.text`Total part 2`,
					value: partTwo,
				}),
				totalsRow(context, {
					title: localization.text`Final score`,
					value: calculateGameTotal(partOne, bonus, partTwo),
					extraClass: styles.finalRow,
				}),
			)
		}

		render()
		store.on('change', signal, render)

		replace(element('article', {
			role: 'presentation',
			children: element('table', {
				classes: styles.scoreTable,
				children: [
					element('colgroup', {
						children: [
							tableColumn(context, styles.labelColumn),
							tableColumn(context, styles.totalsColumn),
						],
					}),
					sectionBand(context, [
						{ text: localization.text`Rounds total`, classes: styles.bandTitle },
						{ text: localization.text`Score`, classes: styles.bandTotalsScore },
					]),
					body,
				],
			}),
		}))
	},
})
