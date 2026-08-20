import { component } from '@rooted/components'
import type { ReadonlyState } from '@rooted/store'

import type { ScoreField } from '../_logic/gameConstants.ts'
import type { ScorePad } from '../_logic/score/scorePad.ts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import type { RenderContext } from '../../_shared/render-context.ts'

import type { RowRegistry } from './row-registry.mts'
import { scoreRow } from './score-row.mts'
import { sectionBand, tableColumn } from './score-table.mts'
import type { SelectionState, SelectionStore } from './selection-store.mts'
import styles from './score-table.css'

export type ScoreSectionOptions = {
	store: ScorePadStore
	selection: SelectionStore
	rows: RowRegistry
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
 *
 * It also owns hover previews. The overlay proposes a projected pad cell and
 * this renders it through the same `scoreRow` the committed state uses, so a
 * preview cannot drift from what the row looks like after applying.
 */
export const ScoreSection = component<ScoreSectionOptions>({
	name: 'score-section',
	styles,
	onMount({ replace, element, create, signal, options }) {
		const context: RenderContext = { element, create }
		const { store, selection, rows, title, fields, withDieIcon } = options

		const body = element('tbody')
		const rowElements = new Map<ScoreField, HTMLTableRowElement>()
		/** Which field this section is currently showing a preview for. */
		let previewed: ScoreField | undefined

		/** The pad as this row should render it — real, or with a preview substituted. */
		function padFor(field: ScoreField, preview: SelectionState['preview']): ReadonlyState<ScorePad> {
			const pad = store.value.pad
			if (preview === undefined || preview.field !== field) return pad
			return { ...pad, [field]: preview.cell } as ReadonlyState<ScorePad>
		}

		function renderAll() {
			const preview = selection.value.preview
			rowElements.clear()
			body.replaceChildren(...fields.map((field) => {
				const row = scoreRow(context, { field, pad: padFor(field, preview), withDieIcon })
				rowElements.set(field, row)
				rows.set(field, row)
				return row
			}))
			previewed = preview !== undefined && rowElements.has(preview.field) ? preview.field : undefined
			applyState()
		}

		/**
		 * Selection state that is pure decoration — no re-render, just
		 * attributes on the rows that are already there.
		 */
		function applyState() {
			const { targets, hover, preview } = selection.value
			for (const [field, row] of rowElements) {
				const target = targets[field]
				if (target === undefined) delete row.dataset.target
				else row.dataset.target = target

				if (hover === field) row.dataset.hover = 'true'
				else delete row.dataset.hover

				if (preview?.field === field) row.dataset.preview = target ?? 'valid'
				else delete row.dataset.preview
			}
		}

		/** Re-render only the rows whose preview state actually changed. */
		function applyPreview() {
			const preview = selection.value.preview
			const next = preview !== undefined && rowElements.has(preview.field) ? preview.field : undefined
			if (next !== previewed) {
				for (const field of [previewed, next]) {
					if (field === undefined) continue
					const row = rowElements.get(field)
					if (row === undefined) continue
					scoreRow(context, { field, pad: padFor(field, preview), withDieIcon }, row)
				}
				previewed = next
			}
			applyState()
		}

		renderAll()
		store.on('change', signal, renderAll)
		selection.on('change', signal, applyPreview)

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
