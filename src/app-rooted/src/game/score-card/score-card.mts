import { component, cssClass, type ComponentContext, type CssClass } from '@rooted/components'
import type { ReadonlyState, Store } from '@rooted/store'

import { dice, roundAmount, type Dice, type ScoreField } from '../_logic/gameConstants.ts'
import { partOneFields, partTwoFields } from '../_logic/fields.ts'
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
import { dieNode } from '../../_shared/die/die-node.mts'
import type { RenderContext } from '../../_shared/render-context.ts'
import { Icon } from '../../_shared/icon/icon.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { menuStore } from '../../_shared/stores/menuStore.mts'
import { playerNameStore } from '../../_shared/stores/playerNameStore.mts'
import { inputActiveStore } from '../score-input/input-active-store.mts'

import { renderRollCell } from './roll-cell.mts'
import { getRowDisplayLabels } from './score-card.labels.ts'
import partyIcon from './score-card.party.svg?raw'
import styles from './score-card.css'


export type ScoreCardOptions = {
	store: ScorePadStore
	openRequest: Store<boolean>
}

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
			placeholder: localization.text`Your name here`,
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
			aria: {
				label: localization.text`Clear name`
			},
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
		writeRoundLabel(roundLabel, store.value.round, create)

		const partOneBlock = element('article', {
			role: 'presentation'
		})
		const partTwoBlock = element('article', {
			role: 'presentation'
		})
		const totalsBlock = element('article', {
			role: 'presentation'
		})

		function rerender() {
			partOneBlock.replaceChildren(renderPartOne(context, store.value.pad))
			partTwoBlock.replaceChildren(renderPartTwo(context, store.value.pad))
			totalsBlock.replaceChildren(renderTotals(context, store.value.pad))
			writeRoundLabel(roundLabel, store.value.round, create)
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
							textContent: localization.text`Player`,
						}),
						element('span', {
							classes: styles.nameInputWrap,
							children: [
								nameInput,
								clearNameButton
							],
						}),
					],
				}),
				roundLabel,
			],
		})

		const cardHeader = element('header', {
			classes: styles.cardHeader,
			children: [
				element('span', {
					classes: styles.cardTitle,
					textContent: localization.text`Score card`
				}),
			],
		})

		const cardInner = element('div', {
			classes: styles.cardInner,
			children: [
				cardHeader,
				banner,
				partOneBlock,
				partTwoBlock,
				totalsBlock
			],
		})

		const stickerButton = element('button', {
			type: 'button',
			classes: styles.sticker,
			aria: {
				label: localization.text`Enter score`
			},
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
			children: [
				cardInner,
				stickerButton
			],
		})

		append(card)
	},
})

// TODO this isn't using rooted properly, this file should be split into components.
function writeRoundLabel(target: HTMLElement, round: number, create: ComponentContext['create']): void {
	if (round > roundAmount) {
		target.classList.add(styles.roundLabelFinished!)
		target.setAttribute('aria-label', localization.text`Game finished`)
		target.replaceChildren(create(Icon, {
			source: partyIcon,
		}))
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
		Object.assign(document.createElement('span'), { textContent: localization.text`Round`, className: styles.roundHeading! }),
		line,
	)
}

function renderPartOne(context: RenderContext, pad: ReadonlyState<ScorePad>): Node {
	return renderSection(context, localization.text`Part one`, partOneFields, pad, true)
}

function renderPartTwo(context: RenderContext, pad: ReadonlyState<ScorePad>): Node {
	return renderSection(context, localization.text`Part two`, partTwoFields, pad, false)
}

function renderSection(context: RenderContext, title: string, fields: ScoreField[], pad: ReadonlyState<ScorePad>, withDieIcon: boolean): Node {
	const { element } = context
	const rows = fields.map(field => renderRow(context, field, pad, withDieIcon))
	const bandCell = element('td', {
		classes: styles.sectionName,
		children: element('div', {
			classes: styles.bandInner,
			children: [
				element('span', {
					classes: [
						styles.bandCell,
						styles.bandTitle
					],
					textContent: title
				}),
				element('span', {
					classes: [
						styles.bandCell,
						styles.bandRoll
					],
					textContent: localization.text`Roll`
				}),
				element('span', {
					classes: [
						styles.bandCell,
						styles.bandScore
					],
					textContent: localization.text`Score`
				}),
			],
		}),
	})
	bandCell.colSpan = 3
	return element('table', {
		classes: styles.scoreTable,
		children: [
			element('colgroup', {
				children: [
					element('col', {
						classes: styles.labelColumn
					}),
					element('col', {
						classes: styles.rollColumn
					}),
					element('col', {
						classes: styles.scoreColumn
					}),
				],
			}),
			element('thead', {
				children: element('tr', {
					classes: styles.sectionRow,
					children: bandCell
				}),
			}),
			element('tbody', {
				children: rows
			}),
		],
	})
}

function renderRow(context: RenderContext, field: ScoreField, pad: ReadonlyState<ScorePad>, withDieIcon: boolean): HTMLElement {
	const { element, create } = context
	const label = getRowDisplayLabels()[field]
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
		labelChildren.push(element('span', {
			classes: styles.labelIcon,
			children: dieNode(context, dice[field as Dice]),
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
				children: element('span', {
					classes: styles.labelDisplay,
					children: labelChildren
				}),
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

type LabelInfo = ReturnType<typeof getRowDisplayLabels>[ScoreField]

function renderDescription(context: RenderContext, label: LabelInfo): Node {
	const { element } = context
	const { short, long } = label.scoreDescription
	if (short === undefined) {
		return element('span', {
			classes: [
				styles.descriptionLabel,
				styles.simpleDescriptionLabel
			],
			textContent: long,
		})
	}
	return element('span', {
		classes: [
			styles.descriptionLabel,
			styles.responsiveDescriptionLabel
		],
		aria: {
			label: long
		},
		children: [
			element('span', {
				classes: styles.descriptionShort,
				textContent: short
			}),
			element('span', {
				classes: styles.descriptionLong,
				textContent: long
			}),
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
					children: element('span', {
						classes: styles.labelDisplay,
						children: labelChildren
					}),
				}),
				element('td', {
					classes: styles.totalsColumn,
					children: element('span', {
						classes: [
							styles.scoreValue,
							cssClass(styles.scoreValueMark, valueText === '.'),
							cssClass(styles.scoreValueFilled, valueText !== '.'),
						],
						textContent: valueText,
					}),
				}),
			],
		})
	}

	const bonusDescription = element('span', {
		classes: [
			styles.descriptionLabel,
			styles.responsiveDescriptionLabel
		],
		aria: {
			label: localization.text`Adds 35 if part one ≥ 63`
		},
		children: [
			element('span', {
				classes: styles.descriptionShort,
				textContent: localization.text`+35 if part1 ≥ 63`
			}),
			element('span', {
				classes: styles.descriptionLong,
				textContent: localization.text`Adds 35 if part one ≥ 63`
			}),
		],
	})

	const totalsBand = element('td', {
		classes: styles.sectionName,
		colSpan: 2,
		children: element('div', {
			classes: styles.bandInner,
			children: [
				element('span', {
					classes: [
						styles.bandCell,
						styles.bandTitle
					],
					textContent: localization.text`Rounds total`
				}),
				element('span', {
					classes: [
						styles.bandCell,
						styles.bandTotalsScore
					],
					textContent: localization.text`Score`
				}),
			],
		}),
	})

	return element('table', {
		classes: styles.scoreTable,
		children: [
			element('colgroup', {
				children: [
					element('col', {
						classes: styles.labelColumn
					}),
					element('col', {
						classes: styles.totalsColumn
					}),
				],
			}),
			element('thead', {
				children: element('tr', {
					classes: styles.sectionRow,
					children: totalsBand
				}),
			}),
			element('tbody', {
				children: [
					totalsRow([element('span', {
						classes: styles.labelText,
						children: element('span', {
							classes: styles.labelTitle,
							textContent: localization.text`Total part 1`
						})
					})], partOne === 0 ? '.' : String(partOne)),
					totalsRow([element('span', {
						classes: styles.labelText,
						children: [
							element('span', {
								classes: styles.labelTitle,
								textContent: localization.text`Bonus`
							}),
							bonusDescription,
						],
					})], bonus === 0 ? '.' : String(bonus)),
					totalsRow([element('span', {
						classes: styles.labelText,
						children: element('span', {
							classes: styles.labelTitle,
							textContent: localization.text`Total part 2`
						})
					})], partTwo === 0 ? '.' : String(partTwo)),
					totalsRow([element('span', {
						classes: styles.labelText,
						children: element('span', {
							classes: styles.labelTitle,
							textContent: localization.text`Final score`
						})
					})], total === 0 ? '.' : String(total), styles.finalRow),
				],
			}),
		],
	})
}
