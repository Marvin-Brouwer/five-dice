import { component, cssClass, type ComponentContext, type CssClass } from '@rooted/components'
import type { ReadonlyState } from '@rooted/store'

import { roundAmount, type ScoreField } from '../_logic/gameConstants.ts'
import { isDiscarded, isFlushScore, type ValidScore } from '../_logic/score/score.ts'
import {
	calculateGameTotal,
	calculatePartOneBonus,
	calculatePartOneSubTotal,
	calculatePartTwoTotal,
	calculateScoreForPad,
	hasPartOneBonus,
} from '../_logic/score/scoreCalculator.ts'
import type { ScorePad } from '../_logic/score/scorePad.ts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { playerNameStore } from '../../_shared/stores/playerNameStore.mts'

import { rowDisplayLabels } from './score-card.labels.ts'
import styles from './score-card.css'

const partOneFields: ScoreField[] = ['aces', 'deuces', 'threes', 'fours', 'fives', 'sixes']
const partTwoFields: ScoreField[] = ['threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'flush', 'chance']

export type ScoreCardOptions = {
	store: ScorePadStore
}

export const ScoreCard = component<ScoreCardOptions>({
	name: 'score-card',
	styles,
	onMount({ append, element, signal, options }) {
		const { store } = options

		const nameInput = element('input', {
			type: 'text',
			id: 'player-name',
			classes: styles.nameInput,
			placeholder: 'Your name here',
			value: playerNameStore.value,
			on: {
				input(event) {
					const value = (event.currentTarget as HTMLInputElement).value
					playerNameStore.update(() => value)
					syncClearButton()
				},
			},
		})

		const clearNameButton = element('button', {
			type: 'button',
			classes: styles.nameClearButton,
			textContent: '×',
			aria: { label: 'Clear name' },
			hidden: playerNameStore.value.length === 0,
			on: {
				click() {
					playerNameStore.update(() => '')
					nameInput.value = ''
					nameInput.focus()
					syncClearButton()
				},
			},
		})

		function syncClearButton() {
			clearNameButton.hidden = nameInput.value.length === 0
		}

		const roundLabel = element('span', {
			classes: styles.roundLabel,
			textContent: renderRoundLabel(store.value.round),
			aria: { live: 'polite' },
		})

		const totalsBlock = element('div', { classes: styles.totals })
		const partOneBlock = element('div', { classes: styles.section })
		const partTwoBlock = element('div', { classes: styles.section })

		function rerender() {
			partOneBlock.replaceChildren(...renderSection(element, 'Part one', partOneFields, store.value.pad))
			partTwoBlock.replaceChildren(...renderSection(element, 'Part two', partTwoFields, store.value.pad))
			totalsBlock.replaceChildren(...renderTotals(element, store.value.pad))
			roundLabel.textContent = renderRoundLabel(store.value.round)
		}

		rerender()

		store.on('change', signal, () => rerender())

		append(
			element('header', {
				classes: styles.cardHeader,
				children: [
					element('label', {
						classes: styles.nameLabel,
						htmlFor: 'player-name',
						textContent: 'Player',
					}),
					element('span', {
						classes: styles.nameInputWrap,
						children: [nameInput, clearNameButton],
					}),
					roundLabel,
				],
			}),
			partOneBlock,
			partTwoBlock,
			totalsBlock,
		)
	},
})

function renderRoundLabel(round: number): string {
	if (round > roundAmount) return 'Game finished'
	return `Round ${round} / ${roundAmount}`
}

function renderSection(element: ComponentContext['element'], title: string, fields: ScoreField[], pad: ReadonlyState<ScorePad>): Node[] {
	const rows = fields.map(field => renderRow(element, field, pad))
	return [
		element('h2', { classes: styles.sectionTitle, textContent: title }),
		element('table', {
			classes: styles.scoreTable,
			children: [
				element('thead', {
					children: element('tr', {
						children: [
							element('th', { textContent: 'Label', scope: 'col' }),
							element('th', { textContent: 'Roll', scope: 'col', classes: styles.rollHeader }),
							element('th', { textContent: 'Score', scope: 'col', classes: styles.scoreHeader }),
						],
					}),
				}),
				element('tbody', { children: rows }),
			],
		}),
	]
}

function renderRoll(cell: ReadonlyState<ValidScore | ScorePad['flush']> | undefined): string {
	if (cell === undefined) return ''
	if (isDiscarded(cell)) return ''
	if (isFlushScore(cell)) {
		if (cell.length === 0) return ''
		const latest = cell[cell.length - 1]!
		return Array.from(latest).join(' ')
	}
	return Array.from(cell as ReadonlyState<ValidScore>).join(' ')
}

function renderRow(element: ComponentContext['element'], field: ScoreField, pad: ReadonlyState<ScorePad>) {
	const label = rowDisplayLabels[field]
	const cell = pad[field]
	let scoreText = '—'
	let extraClass: CssClass = undefined

	if (cell === undefined) {
		scoreText = ''
		extraClass = styles.empty
	}
	else if (isDiscarded(cell)) {
		scoreText = '—'
		extraClass = styles.discarded
	}
	else {
		const value = calculateScoreForPad(pad, field)
		scoreText = String(value)
	}

	const row = element('tr', {
		classes: [extraClass, cssClass(styles.rowApplied, scoreText !== '' && scoreText !== '—')],
		children: [
			element('th', { scope: 'row', textContent: label.title }),
			element('td', { classes: styles.rollCell, textContent: renderRoll(cell) }),
			element('td', { classes: styles.scoreCell, textContent: scoreText }),
		],
	})
	row.dataset.field = field
	return row
}

function renderTotals(element: ComponentContext['element'], pad: ReadonlyState<ScorePad>): Node[] {
	const partOne = calculatePartOneSubTotal(pad)
	const bonus = calculatePartOneBonus(partOne)
	const partTwo = calculatePartTwoTotal(pad)
	const total = calculateGameTotal(partOne, bonus, partTwo)

	return [
		element('h2', { classes: styles.sectionTitle, textContent: 'Totals' }),
		element('dl', {
			classes: styles.totalsList,
			children: [
				element('dt', { textContent: 'Part one subtotal' }),
				element('dd', { textContent: String(partOne) }),
				element('dt', { textContent: hasPartOneBonus(partOne) ? 'Bonus (≥ 63)' : 'Bonus (needs ≥ 63)' }),
				element('dd', { textContent: String(bonus) }),
				element('dt', { textContent: 'Part two subtotal' }),
				element('dd', { textContent: String(partTwo) }),
				element('dt', { classes: styles.finalLabel, textContent: 'Final score' }),
				element('dd', { classes: styles.finalScore, textContent: String(total) }),
			],
		}),
	]
}
