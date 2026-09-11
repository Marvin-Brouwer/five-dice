import { component } from '@rooted/components'

import {
	calculateGameTotal,
	calculatePartOneBonus,
	calculatePartOneSubTotal,
	calculatePartTwoTotal,
} from '../logic/score/scoreCalculator.ts'
import type { ScorePadStore } from '../logic/scorePadStore.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import type { RenderContext } from '../../_shared/render-context.ts'
import { scrollPageTo } from '../../_shared/services/page-scroll.mts'

import { totalsRow } from './score-row.mts'
import { sectionBand, tableColumn } from './score-table.mts'
import styles from './score-table.css'

export type TotalsTableOptions = {
	store: ScorePadStore
}

/** Breathing room under the totals once they have been brought into view. */
const revealMargin = 12

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

		/**
		 * Bring the totals onto the screen when the game ends — the final score
		 * is what the last move was for, and on a phone it is usually below the
		 * fold.
		 *
		 * Down only, and no further than it takes: the rule is that the bottom
		 * of the table ends up on the bottom edge of the viewport or above it,
		 * so a reader who is already looking at the totals — or past them, at
		 * the doormat — is left where they are rather than jerked back.
		 *
		 * It lives here rather than beside the confetti because this is the
		 * component that owns the element; `wireGameCelebration` deliberately
		 * has no markup of its own to measure.
		 */
		function revealTotals() {
			if (!root.isConnected) return
			const overhang = root.getBoundingClientRect().bottom + revealMargin - window.innerHeight
			if (overhang <= 0) return
			scrollPageTo(window.scrollY + overhang)
		}

		/**
		 * Primed from the current state, the same way the celebration is: the
		 * pad store outlives this page, so a remount — a language switch, say —
		 * can land on a game that was already over, and that is not a moment to
		 * take the page over.
		 */
		let ended = store.gameEnded()
		function syncEnd() {
			if (!store.gameEnded()) {
				ended = false
				return
			}
			if (ended) return
			ended = true
			// A frame later: the round label swaps for its finished badge and
			// the sticker is taken away on this same change, and both of those
			// move the table this is measuring.
			requestAnimationFrame(revealTotals)
		}

		render()
		store.on('change', signal, render)
		store.on('change', signal, syncEnd)

		const root = element('article', {
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
		})

		replace(root)
	},
})
