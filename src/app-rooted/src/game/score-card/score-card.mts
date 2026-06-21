import { component, type ComponentContext, type CssClass } from '@rooted/components'

import { roundAmount, type ScoreField } from '../_logic/gameConstants.ts'
import { isDiscarded, isFlushScore } from '../_logic/score/score.ts'
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
				},
			},
		})

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
					nameInput,
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

function renderSection(element: ComponentContext['element'], title: string, fields: ScoreField[], pad: Readonly<ScorePad>): Node[] {
	const rows = fields.map(field => renderRow(element, field, pad))
	return [
		element('h2', { classes: styles.sectionTitle, textContent: title }),
		element('table', {
			classes: styles.scoreTable,
			children: [
				element('thead', {
					children: element('tr', {
						children: [
							element('th', { textContent: 'Row', scope: 'col' }),
							element('th', { textContent: 'Description', scope: 'col' }),
							element('th', { textContent: 'Score', scope: 'col' }),
						],
					}),
				}),
				element('tbody', { children: rows }),
			],
		}),
	]
}

function renderRow(element: ComponentContext['element'], field: ScoreField, pad: Readonly<ScorePad>) {
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
	else if (isFlushScore(cell)) {
		const value = calculateScoreForPad(pad, field)
		scoreText = String(value)
	}
	else {
		const value = calculateScoreForPad(pad, field)
		scoreText = String(value)
	}

	return element('tr', {
		classes: extraClass,
		children: [
			element('th', { scope: 'row', textContent: label.title }),
			element('td', {
				classes: styles.descriptionCell,
				textContent: label.scoreDescription.short ?? label.scoreDescription.long,
			}),
			element('td', { classes: styles.scoreCell, textContent: scoreText }),
		],
	})
}

function renderTotals(element: ComponentContext['element'], pad: Readonly<ScorePad>): Node[] {
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
