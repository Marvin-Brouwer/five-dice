import { component, cssClass, type ComponentContext, type CssClass } from '@rooted/components'
import type { ReadonlyState, Store } from '@rooted/store'

import { dice, roundAmount, type Dice, type ScoreField } from '../_logic/gameConstants.ts'
import { isDiscarded } from '../_logic/score/score.ts'
import {
	calculateGameTotal,
	calculatePartOneBonus,
	calculatePartOneSubTotal,
	calculatePartTwoTotal,
	calculateScoreForPad,
} from '../_logic/score/scoreCalculator.ts'
import type { ScorePad } from '../_logic/score/scorePad.ts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { PipDie } from '../../_shared/die/pip-die.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { menuStore } from '../../_shared/stores/menuStore.mts'
import { playerNameStore } from '../../_shared/stores/playerNameStore.mts'
import { inputActiveStore } from '../score-input/input-active-store.mts'

import { renderRollCell } from './roll-cell.mts'
import { rowDisplayLabels } from './score-card.labels.ts'
import styles from './score-card.css'

const partOneFields: Dice[] = ['aces', 'deuces', 'threes', 'fours', 'fives', 'sixes']
const partTwoFields: ScoreField[] = ['threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'flush', 'chance']

const partyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.981 7.009c-1.222-.733-2.473-.752-3.57-.254-.085 3.098-1.47 5.561-3.115 7.04.19.897.558 1.635.984 2.123l-1.204.733.729.437c-.875 1.531-1.372 4.054-1.228 6.442.015.265.236.47.499.47.287 0 .516-.242.499-.531-.146-2.422.402-4.65 1.086-5.867l.762.457.008-1.457c1.569.33 4.302-.524 5.818-3.253 1.282-2.309.995-4.983-1.268-6.34m-4.457-.55c0-3.566-2.051-6.459-5.542-6.459-3.493 0-5.543 2.893-5.543 6.459 0 4.384 2.709 7.077 4.751 7.697l-.954 1.542h1.151c-.544 1.958-.178 2.961.155 3.85.35.933.651 1.738-.132 3.772-.099.258.029.547.288.646l.179.034c.202 0 .391-.122.467-.321.918-2.388.521-3.452.136-4.48-.32-.857-.611-1.682-.047-3.501h1.325l-.96-1.552c2.039-.657 4.726-3.42 4.726-7.687m-9.32 10.634l.738-.442-1.232-.697c.425-.472.794-1.197.993-2.077-1.673-1.46-3.076-3.949-3.153-7.147-1.082-.471-2.313-.442-3.513.279-2.263 1.357-2.55 4.031-1.268 6.34 1.53 2.754 4.3 3.6 5.862 3.246l-.035 1.464.752-.452c1.005 1.65 1.317 4.058 1.156 5.848-.025.275.179.518.453.543l.047.002c.256 0 .474-.196.497-.455.164-1.822-.104-4.497-1.297-6.452m13.588-13.584l-1.182.009.653.985-.356 1.126 1.138-.317.963.687.05-1.181.95-.702-1.107-.413-.374-1.12-.735.926zm-19.199 15.329l-1.181.009.653.985-.356 1.127 1.138-.318.962.688.051-1.181.95-.702-1.108-.413-.374-1.121-.735.926zm.407-17.232c0 .769.625 1.393 1.395 1.393.769 0 1.394-.624 1.394-1.393s-.625-1.393-1.394-1.393c-.77 0-1.395.624-1.395 1.393m-2.001 3.131c0 .552.45 1 1.001 1 .553 0 1-.448 1-1s-.447-1-1-1c-.551 0-1.001.448-1.001 1m17.371-3.737c0 .552.448 1 1 1s1.001-.448 1.001-1-.449-1-1.001-1c-.552 0-1 .448-1 1m2.371 17.12c.828 0 1.501.673 1.501 1.5 0 .828-.673 1.5-1.501 1.5-.828 0-1.501-.672-1.501-1.5 0-.827.673-1.5 1.501-1.5"/></svg>`

export type ScoreCardOptions = {
	store: ScorePadStore
	openRequest: Store<boolean>
}

type RenderContext = Pick<ComponentContext, 'element' | 'create'>

export const ScoreCard = component<ScoreCardOptions>({
	name: 'score-card',
	styles,
	onMount(context) {
		const { append, element, create, signal, options } = context
		const { store, openRequest } = options

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
			aria: { live: 'polite' },
		})
		writeRoundLabel(roundLabel, store.value.round)

		const partOneBlock = element('article', { id: 'part1', role: 'presentation' })
		const partTwoBlock = element('article', { id: 'part2', role: 'presentation' })
		const totalsBlock = element('article', { id: 'score', role: 'presentation' })

		function rerender() {
			partOneBlock.replaceChildren(renderPartOne(context, store.value.pad))
			partTwoBlock.replaceChildren(renderPartTwo(context, store.value.pad))
			totalsBlock.replaceChildren(renderTotals(context, store.value.pad))
			writeRoundLabel(roundLabel, store.value.round)
		}

		rerender()

		store.on('change', signal, () => rerender())

		const banner = element('aside', {
			role: 'banner',
			classes: styles.banner,
			children: [
				element('span', {
					classes: styles.nameField,
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
					],
				}),
				roundLabel,
			],
		})

		const cardHeader = element('header', {
			classes: styles.cardHeader,
			children: [
				element('span', { classes: styles.cardTitle, textContent: 'Score card' }),
			],
		})

		const cardInner = element('div', {
			classes: styles.cardInner,
			children: [cardHeader, banner, partOneBlock, partTwoBlock, totalsBlock],
		})

		const stickerButton = element('button', {
			type: 'button',
			classes: styles.sticker,
			aria: { label: 'Enter score' },
			on: {
				click() {
					if (store.gameEnded()) return
					openRequest.update(() => true)
				},
			},
			children: [
				element('span', {
					classes: styles.stickerLabel,
					textContent: localization.text`Enter\nscore`
				}),
			],
		})

		function syncSticker() {
			const ended = store.gameEnded()
			const blocked = inputActiveStore.value || menuStore.value
			stickerButton.hidden = ended
			stickerButton.disabled = ended
			stickerButton.classList.toggle(styles.stickerInert!, blocked)
			stickerButton.setAttribute('aria-hidden', blocked ? 'true' : 'false')
			stickerButton.tabIndex = blocked ? -1 : 0
		}
		store.on('change', signal, syncSticker)
		inputActiveStore.on('change', signal, syncSticker)
		menuStore.on('change', signal, syncSticker)
		syncSticker()

		const card = element('section', {
			id: 'score-card',
			classes: styles.card,
			role: 'document',
			children: [cardInner, stickerButton],
		})

		append(card)
	},
})

function writeRoundLabel(target: HTMLElement, round: number): void {
	if (round > roundAmount) {
		target.classList.add(styles.roundLabelFinished!)
		target.setAttribute('aria-label', 'Game finished')
		target.innerHTML = partyIconSvg
		return
	}
	target.classList.remove(styles.roundLabelFinished!)
	target.removeAttribute('aria-label')
	const line = document.createElement('span')
	line.className = styles.roundLine!
	line.append(
		Object.assign(document.createElement('span'), { textContent: String(round), className: styles.roundNumber! }),
		Object.assign(document.createElement('span'), { textContent: `/${roundAmount}`, className: styles.roundOf! }),
	)
	target.replaceChildren(
		Object.assign(document.createElement('span'), { textContent: 'Round', className: styles.roundHeading! }),
		line,
	)
}

function renderPartOne(context: RenderContext, pad: ReadonlyState<ScorePad>): Node {
	return renderSection(context, 'Part one', partOneFields, pad, true)
}

function renderPartTwo(context: RenderContext, pad: ReadonlyState<ScorePad>): Node {
	return renderSection(context, 'Part two', partTwoFields, pad, false)
}

function renderSection(context: RenderContext, title: string, fields: ScoreField[], pad: ReadonlyState<ScorePad>, withDieIcon: boolean): Node {
	const { element } = context
	const rows = fields.map(field => renderRow(context, field, pad, withDieIcon))
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

function renderRow(context: RenderContext, field: ScoreField, pad: ReadonlyState<ScorePad>, withDieIcon: boolean): HTMLElement {
	const { element, create } = context
	const label = rowDisplayLabels[field]
	const cell = pad[field]

	let scoreText = '.'
	let discarded = false
	let applied = false
	if (cell === undefined) {
		scoreText = '.'
	}
	else if (isDiscarded(cell)) {
		scoreText = ''
		discarded = true
	}
	else {
		const value = calculateScoreForPad(pad, field)
		scoreText = value === 0 ? '.' : String(value)
		applied = value !== 0
	}

	const labelChildren: Array<Node | string> = []
	if (withDieIcon) {
		labelChildren.push(create(PipDie, {
			value: dice[field as Dice],
			size: 18,
			variant: 'default',
			ariaLabel: `${dice[field as Dice]}`,
		}))
	}
	labelChildren.push(element('span', {
		classes: styles.labelText,
		children: [
			element('span', { classes: styles.labelTitle, textContent: label.title }),
			renderDescription(context, label),
		],
	}))

	const scoreChildren: Array<Node | string> = [
		element('span', {
			classes: [
				styles.scoreValue,
				cssClass(styles.scoreValueMark, scoreText === '.' || scoreText === '/'),
				cssClass(styles.scoreValueFilled, applied),
			],
			textContent: scoreText,
		}),
	]

	const row = element('tr', {
		classes: [
			styles.rowDisplay,
			cssClass(styles.discarded, discarded),
			cssClass(styles.rowApplied, applied),
		],
		children: [
			element('th', {
				scope: 'row',
				classes: styles.labelColumn,
				children: [element('span', { classes: styles.labelDisplay, children: labelChildren })],
			}),
			element('td', {
				classes: styles.rollColumn,
				children: renderRollCell(context, field, cell),
			}),
			element('td', {
				classes: styles.scoreColumn,
				children: scoreChildren,
			}),
		],
	})
	row.dataset.field = field
	;(row.children[2] as HTMLElement).dataset.cell = 'score'
	return row
}

type LabelInfo = (typeof rowDisplayLabels)[ScoreField]

function renderDescription(context: RenderContext, label: LabelInfo): Node {
	const { element } = context
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

function renderTotals(context: RenderContext, pad: ReadonlyState<ScorePad>): Node {
	const { element } = context
	const partOne = calculatePartOneSubTotal(pad)
	const bonus = calculatePartOneBonus(partOne)
	const partTwo = calculatePartTwoTotal(pad)
	const total = calculateGameTotal(partOne, bonus, partTwo)

	function totalsRow(labelChildren: Array<Node | string>, valueText: string, extra?: CssClass): HTMLElement {
		return element('tr', {
			classes: [styles.rowDisplay, extra],
			children: [
				element('td', {
					classes: styles.labelColumn,
					children: [element('span', { classes: styles.labelDisplay, children: labelChildren })],
				}),
				element('td', {
					classes: styles.totalsColumn,
					children: [element('span', {
						classes: [
							styles.scoreValue,
							cssClass(styles.scoreValueMark, valueText === '.'),
							cssClass(styles.scoreValueFilled, valueText !== '.'),
						],
						textContent: valueText,
					})],
				}),
			],
		})
	}

	const bonusDescription = element('span', {
		classes: [styles.descriptionLabel, styles.responsiveDescriptionLabel],
		aria: { label: 'Adds 35 if part one ≥ 63' },
		children: [
			element('span', { classes: styles.descriptionShort, textContent: '+35 if part1 ≥ 63' }),
			element('span', { classes: styles.descriptionLong, textContent: 'Adds 35 if part one ≥ 63' }),
		],
	})

	const totalsBand = element('td', {
		classes: styles.sectionName,
		children: element('div', {
			classes: styles.bandInner,
			children: [
				element('span', { classes: [styles.bandCell, styles.bandTitle], textContent: 'Rounds total' }),
				element('span', { classes: [styles.bandCell, styles.bandTotalsScore], textContent: 'Score' }),
			],
		}),
	})
	totalsBand.colSpan = 2
	return element('table', {
		classes: styles.scoreTable,
		children: [
			element('colgroup', {
				children: [
					element('col', { classes: styles.labelColumn }),
					element('col', { classes: styles.totalsColumn }),
				],
			}),
			element('thead', {
				children: element('tr', { classes: styles.sectionRow, children: [totalsBand] }),
			}),
			element('tbody', {
				children: [
					totalsRow([element('span', { classes: styles.labelText, children: [element('span', { classes: styles.labelTitle, textContent: 'Total part 1' })] })], partOne === 0 ? '.' : String(partOne)),
					totalsRow([element('span', {
						classes: styles.labelText,
						children: [
							element('span', { classes: styles.labelTitle, textContent: 'Bonus' }),
							bonusDescription,
						],
					})], bonus === 0 ? '.' : String(bonus)),
					totalsRow([element('span', { classes: styles.labelText, children: [element('span', { classes: styles.labelTitle, textContent: 'Total part 2' })] })], partTwo === 0 ? '.' : String(partTwo)),
					totalsRow([element('span', { classes: styles.labelText, children: [element('span', { classes: styles.labelTitle, textContent: 'Final score' })] })], total === 0 ? '.' : String(total), styles.finalRow),
				],
			}),
		],
	})
}
