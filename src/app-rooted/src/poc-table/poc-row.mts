// SPIKE — Phase 0a POC. Not for merge.
// A score-card row rendered as a real component(), so the DOM becomes
// <tbody><r--><tr>…</tr></r--></tbody> instead of <tbody><tr>…</tr></tbody>.
import { component, cssClass, type ComponentContext } from '@rooted/components'
import type { ReadonlyState } from '@rooted/store'

import { type ScoreField } from '../game/_logic/gameConstants.ts'
import { isDiscarded } from '../game/_logic/score/score.ts'
import { calculateScoreForPad } from '../game/_logic/score/scoreCalculator.ts'
import type { ScorePad } from '../game/_logic/score/scorePad.ts'
import { renderRollCell } from '../game/score-card/roll-cell.mts'
import { getRowDisplayLabels } from '../game/score-card/score-card.labels.ts'

import styles from '../game/score-card/score-card.css'

type RenderContext = Pick<ComponentContext, 'element' | 'create'>

export type PocRowOptions = {
	field: ScoreField
	pad: ReadonlyState<ScorePad>
	/** true → the three cells are components too (deepest-risk variant) */
	cellsAsComponents: boolean
}

export function describe(context: RenderContext, field: ScoreField) {
	const { element } = context
	const label = getRowDisplayLabels()[field]
	const { short, long } = label.scoreDescription
	if (short === undefined) {
		return element('span', {
			classes: [styles.descriptionLabel, styles.simpleDescriptionLabel],
			textContent: long,
		})
	}
	return element('span', {
		classes: [styles.descriptionLabel, styles.responsiveDescriptionLabel],
		aria: { label: long },
		children: [
			element('span', { classes: styles.descriptionShort, textContent: short }),
			element('span', { classes: styles.descriptionLong, textContent: long }),
		],
	})
}

export function rowFacts(pad: ReadonlyState<ScorePad>, field: ScoreField) {
	const cell = pad[field]
	let scoreText = '.'
	let discarded = false
	let applied = false
	if (cell === undefined) scoreText = '.'
	else if (isDiscarded(cell)) { scoreText = ''; discarded = true }
	else {
		const value = calculateScoreForPad(pad, field)
		scoreText = value === 0 ? '.' : String(value)
		applied = value !== 0
	}
	return { cell, scoreText, discarded, applied }
}

export function labelCellNode(context: RenderContext, field: ScoreField) {
	const { element } = context
	const label = getRowDisplayLabels()[field]
	return element('th', {
		scope: 'row',
		classes: styles.labelColumn,
		children: [element('span', {
			classes: styles.labelDisplay,
			children: [element('span', {
				classes: styles.labelText,
				children: [
					element('span', { classes: styles.labelTitle, textContent: label.title }),
					describe(context, field),
				],
			})],
		})],
	})
}

export function rollCellNode(context: RenderContext, field: ScoreField, cell: unknown) {
	return context.element('td', {
		classes: styles.rollColumn,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		children: renderRollCell(context, field, cell as any),
	})
}

export function scoreCellNode(context: RenderContext, scoreText: string, applied: boolean) {
	const { element } = context
	const td = element('td', {
		classes: styles.scoreColumn,
		children: [element('span', {
			classes: [
				styles.scoreValue,
				cssClass(styles.scoreValueMark, scoreText === '.' || scoreText === '/'),
				cssClass(styles.scoreValueFilled, applied),
			],
			textContent: scoreText,
		})],
	})
	td.dataset.cell = 'score'
	return td
}

/** Cell-as-component variants (the deepest-risk case). */
export const PocLabelCell = component<{ field: ScoreField }>({
	name: 'poc-label-cell',
	styles,
	onMount({ replace, element, create, options }) {
		replace(labelCellNode({ element, create }, options.field))
	},
})

export const PocRollCell = component<{ field: ScoreField, cell: unknown }>({
	name: 'poc-roll-cell',
	styles,
	onMount({ replace, element, create, options }) {
		replace(rollCellNode({ element, create }, options.field, options.cell))
	},
})

export const PocScoreCell = component<{ scoreText: string, applied: boolean }>({
	name: 'poc-score-cell',
	styles,
	onMount({ replace, element, create, options }) {
		replace(scoreCellNode({ element, create }, options.scoreText, options.applied))
	},
})

export const PocRow = component<PocRowOptions>({
	name: 'poc-row',
	styles,
	onMount({ replace, element, create, options }) {
		const context: RenderContext = { element, create }
		const { field, pad, cellsAsComponents } = options
		const { cell, scoreText, discarded, applied } = rowFacts(pad, field)

		const cells = cellsAsComponents
			? [
				create(PocLabelCell, { field }),
				create(PocRollCell, { field, cell }),
				create(PocScoreCell, { scoreText, applied }),
			]
			: [
				labelCellNode(context, field),
				rollCellNode(context, field, cell),
				scoreCellNode(context, scoreText, applied),
			]

		const row = element('tr', {
			classes: [
				styles.rowDisplay,
				cssClass(styles.discarded, discarded),
				cssClass(styles.rowApplied, applied),
			],
			children: cells,
		})
		row.dataset.field = field
		replace(row)
	},
})
