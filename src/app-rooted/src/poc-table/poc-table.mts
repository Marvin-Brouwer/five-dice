// SPIKE — Phase 0a POC. Not for merge.
// Renders the part-two table three ways so they can be compared in one page:
//   A: rows + cells as free functions       (what the app does today)
//   B: rows as component(), cells as free functions
//   C: rows AND cells as component()
import { component, type ComponentContext } from '@rooted/components'
import type { ReadonlyState } from '@rooted/store'

import { type ScoreField } from '../game/_logic/gameConstants.ts'
import { score } from '../game/_logic/score/score.ts'
import { createScorePad, type ScorePad } from '../game/_logic/score/scorePad.ts'
import { renderRollCell } from '../game/score-card/roll-cell.mts'
import { getRowDisplayLabels } from '../game/score-card/score-card.labels.ts'

import { PocRow, labelCellNode, rollCellNode, rowFacts, scoreCellNode } from './poc-row.mts'
import styles from '../game/score-card/score-card.css'

type RenderContext = Pick<ComponentContext, 'element' | 'create'>

const partTwoFields: ScoreField[] = [
	'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'flush', 'chance',
]

/** A pad with a realistic spread: applied, discarded, empty, and a stacked flush. */
function fixturePad(): ScorePad {
	const pad = createScorePad()
	pad.threeOfKind = score([3, 3, 3, 5, 2])
	pad.fourOfKind = score([6, 6, 6, 6, 1])
	pad.fullHouse = score([2, 2, 5, 5, 5])
	pad.smallStraight = score([1, 2, 3, 4, 6])
	pad.flush = [score([1, 1, 1, 1, 1]), score([4, 4, 4, 4, 4])]
	return pad
}

function freeRow(context: RenderContext, field: ScoreField, pad: ReadonlyState<ScorePad>): HTMLElement {
	const { element } = context
	const { cell, scoreText, discarded, applied } = rowFacts(pad, field)
	const row = element('tr', {
		classes: [
			styles.rowDisplay,
			discarded ? styles.discarded : undefined,
			applied ? styles.rowApplied : undefined,
		],
		children: [
			labelCellNode(context, field),
			rollCellNode(context, field, cell),
			scoreCellNode(context, scoreText, applied),
		],
	})
	row.dataset.field = field
	return row
}

function table(context: RenderContext, title: string, rows: Array<Node>): Node {
	const { element } = context
	const bandCell = element('td', {
		classes: styles.sectionName,
		children: element('div', {
			classes: styles.bandInner,
			children: [
				element('span', { classes: [styles.bandCell, styles.bandTitle], textContent: title }),
				element('span', { classes: [styles.bandCell, styles.bandRoll], textContent: 'Roll' }),
				element('span', { classes: [styles.bandCell, styles.bandScore], textContent: 'Score' }),
			],
		}),
	})
	bandCell.colSpan = 3
	return element('table', {
		classes: styles.scoreTable,
		children: [
			element('colgroup', {
				children: [
					element('col', { classes: styles.labelColumn }),
					element('col', { classes: styles.rollColumn }),
					element('col', { classes: styles.scoreColumn }),
				],
			}),
			element('thead', {
				children: element('tr', { classes: styles.sectionRow, children: [bandCell] }),
			}),
			element('tbody', { children: rows }),
		],
	})
}

export const PocTable = component({
	name: 'poc-table',
	styles,
	onMount({ replace, element, create }) {
		const context: RenderContext = { element, create }
		const pad = fixturePad() as ReadonlyState<ScorePad>

		const variants: Array<[string, string, Array<Node>]> = [
			['variant-a', 'A — free functions (today)',
				partTwoFields.map(field => freeRow(context, field, pad))],
			['variant-b', 'B — rows as components',
				partTwoFields.map(field => create(PocRow, { field, pad, cellsAsComponents: false }))],
			['variant-c', 'C — rows + cells as components',
				partTwoFields.map(field => create(PocRow, { field, pad, cellsAsComponents: true }))],
		]

		const blocks = variants.map(([id, title, rows]) => {
			const article = element('article', { role: 'presentation' })
			article.id = id
			article.append(table(context, title, rows))
			return article
		})

		const inner = element('div', { classes: styles.cardInner, children: blocks })
		const card = element('section', { classes: styles.card, children: [inner] })
		card.id = 'poc-card'
		replace(card)
	},
})

// Exposed so the smoke script can toggle selection state without an overlay.
declare global { interface Window { pocSetSelecting?: (mode: string | null) => void } }
if (typeof window !== 'undefined') {
	window.pocSetSelecting = (mode) => {
		const card = document.getElementById('poc-card')
		if (!card) return
		if (mode === null) delete (card as HTMLElement).dataset.selecting
		else (card as HTMLElement).dataset.selecting = mode
		card.querySelectorAll<HTMLElement>('[data-field]').forEach((row, index) => {
			row.dataset.target = index % 2 === 0 ? 'valid' : 'discard'
			if (index === 1) row.dataset.hover = 'true'
			else delete row.dataset.hover
		})
	}
}

void getRowDisplayLabels
void renderRollCell
