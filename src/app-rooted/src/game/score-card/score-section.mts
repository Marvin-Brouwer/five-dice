import { component } from '@rooted/components'

import type { ScoreField } from '../_logic/gameConstants.ts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import type { RenderContext } from '../../_shared/render-context.ts'

import { scoreRow } from './score-row.mts'
import { sectionBand, tableColumn } from './score-table.mts'
import styles from './score-table.css'

export type ScoreSectionOptions = {
	store: ScorePadStore
	/** Band title, e.g. "Part one". */
	title: string
	fields: ScoreField[]
	/** Part one rows carry a die face beside the title. */
	withDieIcon: boolean
}

/**
 * One part of the score card as a three-column table.
 *
 * Instantiated twice — part one and part two differ only by title, fields and
 * whether rows show a die icon, all of which are fixed at mount, so they fit
 * options exactly. This is the re-render boundary: a pad change rebuilds only
 * this section's `<tbody>`.
 */
export const ScoreSection = component<ScoreSectionOptions>({
	name: 'score-section',
	styles,
	onMount({ replace, element, create, signal, options }) {
		const context: RenderContext = { element, create }
		const { store, title, fields, withDieIcon } = options

		const body = element('tbody')

		function render() {
			const pad = store.value.pad
			body.replaceChildren(...fields.map(field => scoreRow(context, { field, pad, withDieIcon })))
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
							tableColumn(context, styles.rollColumn),
							tableColumn(context, styles.scoreColumn),
						],
					}),
					sectionBand(context, [
						{ text: title, classes: styles.bandTitle },
						{ text: localization.text`Roll`, classes: styles.bandRoll },
						{ text: localization.text`Score`, classes: styles.bandScore },
					]),
					body,
				],
			}),
		}))
	},
})
