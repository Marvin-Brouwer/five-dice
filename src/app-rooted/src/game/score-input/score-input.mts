import { component, ComponentContext } from '@rooted/components'
import { createStore } from '@rooted/store'

import { type DieValue, type ScoreField } from '../_logic/gameConstants.ts'
import { discard, isDiscarded, isFlushScore, score } from '../_logic/score/score.ts'
import { isScoreApplicableToField } from '../_logic/score/scoreFieldValidator.ts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { rowDisplayLabels } from '../score-card/score-card.labels.ts'

import styles from './score-input.css'

const dieValues: DieValue[] = [1, 2, 3, 4, 5, 6]
const dieIndices = [0, 1, 2, 3, 4] as const
type DieIndex = typeof dieIndices[number]

type InputState = {
	dice: Array<DieValue | undefined>
	row: ScoreField | undefined
	flushDiscard: Exclude<ScoreField, 'flush'> | undefined
}

function initialInput(): InputState {
	return { dice: [undefined, undefined, undefined, undefined, undefined], row: undefined, flushDiscard: undefined }
}

export type ScoreInputOptions = {
	store: ScorePadStore
	onCommit?: () => void
}

export const ScoreInput = component<ScoreInputOptions>({
	name: 'score-input',
	styles,
	onMount({ append, element, signal, options }) {
		const { store } = options
		const input = createStore<InputState>(initialInput())

		function hasUnappliedInput(): boolean {
			const state = input.value
			if (state.row !== undefined) return true
			if (state.flushDiscard !== undefined) return true
			return state.dice.some(d => d !== undefined)
		}

		window.addEventListener('beforeunload', (event) => {
			if (!hasUnappliedInput()) return
			event.preventDefault()
			event.returnValue = 'You have a scorepad with changes, are you sure you want to reload the page?'
		}, { signal })

		const diceFieldset = element('fieldset', { classes: styles.fieldset })
		const rowFieldset = element('fieldset', { classes: styles.fieldset })
		const flushFieldset = element('fieldset', { classes: [styles.fieldset, styles.hidden] })
		const submitButton = element('button', {
			type: 'submit',
			classes: styles.submitButton,
			textContent: 'Apply score',
			disabled: true,
		})
		const resetButton = element('button', {
			type: 'button',
			classes: styles.resetButton,
			textContent: 'Clear dice',
			on: { click: () => input.update(() => initialInput()) },
		})

		const liveAnnounce = element('p', {
			classes: styles.liveRegion,
			aria: { live: 'polite', atomic: 'true' },
		})

		function isDiceComplete(): boolean {
			return input.value.dice.every(d => d !== undefined)
		}

		function currentScoreTuple(): [DieValue, DieValue, DieValue, DieValue, DieValue] | null {
			const dice = input.value.dice
			if (!isDiceComplete()) return null
			return dice as [DieValue, DieValue, DieValue, DieValue, DieValue]
		}

		function availableRows(): ScoreField[] {
			const pad = store.value.pad
			return (Object.keys(rowDisplayLabels) as ScoreField[]).filter((field) => {
				const cell = pad[field]
				if (cell === undefined) return true
				if (field === 'flush') return isFlushScore(cell)
				return false
			})
		}

		function rowIsApplicable(field: ScoreField): boolean {
			const tuple = currentScoreTuple()
			if (!tuple) return false
			return isScoreApplicableToField(score(tuple), field)
		}

		function flushNeedsDiscard(): boolean {
			const pad = store.value.pad
			const flushCell = pad.flush
			if (isDiscarded(flushCell)) return false
			return flushCell.length > 0
		}

		function renderDice() {
			diceFieldset.replaceChildren(
				element('legend', { textContent: 'Enter the rolled dice values', classes: styles.legend }),
				...dieIndices.map(idx => renderDieGroup(element, idx, input.value.dice[idx], (value) => {
					input.update((state) => {
						const dice = [...state.dice]
						dice[idx] = value
						return { ...state, dice }
					})
				})),
			)
		}

		function renderRows() {
			const tuple = currentScoreTuple()
			rowFieldset.replaceChildren(
				element('legend', { textContent: 'Select a score row', classes: styles.legend }),
				element('p', {
					classes: styles.hint,
					textContent: tuple
						? 'Pick a row this score applies to, or pick a row to discard.'
						: 'Enter all five dice values to enable row selection.',
				}),
				...availableRows().map(field => renderRowOption(element, field, input.value.row === field, rowIsApplicable(field), !tuple, (value) => {
					input.update(state => ({ ...state, row: value, flushDiscard: undefined }))
				})),
			)
		}

		function renderFlushDiscard() {
			const needs = input.value.row === 'flush'
				&& flushNeedsDiscard()
				&& rowIsApplicable('flush')
			if (!needs) {
				flushFieldset.classList.add(styles.hidden!)
				flushFieldset.replaceChildren()
				return
			}
			flushFieldset.classList.remove(styles.hidden!)
			const pad = store.value.pad
			const discardable = (Object.keys(rowDisplayLabels) as ScoreField[]).filter(field => {
				if (field === 'flush') return false
				return pad[field] === undefined
			}) as Exclude<ScoreField, 'flush'>[]

			flushFieldset.replaceChildren(
				element('legend', { textContent: 'Choose a row to discard for this flush', classes: styles.legend }),
				element('p', {
					classes: styles.hint,
					textContent: 'Every flush after the first requires discarding one unused row.',
				}),
				...discardable.map(field => element('label', {
					classes: styles.radioLabel,
					children: [
						element('input', {
							type: 'radio',
							classes: styles.visuallyHidden,
							name: 'flush-discard',
							value: field,
							checked: input.value.flushDiscard === field,
							on: {
								change(event) {
									const value = (event.currentTarget as HTMLInputElement).value as Exclude<ScoreField, 'flush'>
									input.update(state => ({ ...state, flushDiscard: value }))
								},
							},
						}),
						element('span', { classes: styles.radioIndicator, aria: { hidden: 'true' } }),
						element('span', { classes: styles.radioText, textContent: rowDisplayLabels[field].title }),
					],
				})),
			)
		}

		function syncSubmit() {
			const tuple = currentScoreTuple()
			const row = input.value.row
			let ok = false
			if (tuple && row) {
				if (row === 'flush') {
					if (rowIsApplicable('flush')) {
						ok = !flushNeedsDiscard() || input.value.flushDiscard !== undefined
					}
					else {
						ok = true
					}
				}
				else {
					ok = true
				}
			}
			submitButton.disabled = !ok || store.gameEnded()
		}

		function commit(event: SubmitEvent) {
			event.preventDefault()
			const tuple = currentScoreTuple()
			const row = input.value.row
			if (!tuple || !row) return
			const value = score(tuple)
			try {
				if (!isScoreApplicableToField(value, row)) {
					store.apply({ field: row, score: discard() })
					liveAnnounce.textContent = `Discarded ${rowDisplayLabels[row].title}.`
				}
				else if (row === 'flush') {
					if (flushNeedsDiscard()) {
						store.apply({ field: 'flush', score: value, discard: input.value.flushDiscard! })
						liveAnnounce.textContent = `Flush applied. Discarded ${rowDisplayLabels[input.value.flushDiscard!].title}.`
					}
					else {
						store.apply({ field: 'flush', score: value, discard: 'aces' as Exclude<ScoreField, 'flush'> })
						liveAnnounce.textContent = 'First flush applied.'
					}
				}
				else {
					store.apply({ field: row, score: value })
					liveAnnounce.textContent = `Applied ${rowDisplayLabels[row].title}.`
				}
				input.update(() => initialInput())
				options.onCommit?.()
			}
			catch (e) {
				liveAnnounce.textContent = (e as Error).message
			}
		}

		const form = element('form', {
			classes: styles.form,
			on: { submit: commit },
			children: [
				diceFieldset,
				rowFieldset,
				flushFieldset,
				element('div', {
					classes: styles.actions,
					children: [resetButton, submitButton],
				}),
				liveAnnounce,
			],
		})

		function rerender() {
			renderDice()
			renderRows()
			renderFlushDiscard()
			syncSubmit()
		}

		rerender()

		input.on('change', signal, rerender)
		store.on('change', signal, rerender)

		append(form)
	},
})

function renderDieGroup(element: ComponentContext['element'], idx: DieIndex, current: DieValue | undefined, onChange: (value: DieValue) => void) {
	return element('fieldset', {
		classes: styles.diceGroup,
		children: [
			element('legend', { classes: styles.dieLegend, textContent: `Die ${idx + 1}` }),
			...dieValues.map(value => element('label', {
				classes: styles.dieOption,
				children: [
					element('input', {
						type: 'radio',
						classes: styles.visuallyHidden,
						name: `die-${idx}`,
						value: String(value),
						checked: current === value,
						on: {
							change(event) {
								const v = Number((event.currentTarget as HTMLInputElement).value) as DieValue
								onChange(v)
							},
						},
					}),
					element('span', {
						classes: styles.dieFace,
						aria: { hidden: 'true' },
						textContent: String(value),
					}),
					element('span', {
						classes: styles.visuallyHidden,
						textContent: `Value ${value}`,
					}),
				],
			})),
		],
	})
}

function renderRowOption(element: ComponentContext['element'], field: ScoreField, checked: boolean, applicable: boolean, disabled: boolean, onSelect: (field: ScoreField) => void) {
	const label = rowDisplayLabels[field]
	return element('label', {
		classes: [styles.radioLabel, !applicable && !disabled ? styles.discardOption : undefined],
		children: [
			element('input', {
				type: 'radio',
				classes: styles.visuallyHidden,
				name: 'score-row',
				value: field,
				checked,
				disabled,
				on: {
					change(event) {
						const value = (event.currentTarget as HTMLInputElement).value as ScoreField
						onSelect(value)
					},
				},
			}),
			element('span', { classes: styles.radioIndicator, aria: { hidden: 'true' } }),
			element('span', {
				classes: styles.radioText,
				children: [
					element('strong', { textContent: label.title }),
					' — ',
					element('span', {
						classes: styles.rowMeta,
						textContent: applicable ? (label.scoreDescription.short ?? label.scoreDescription.long) : 'discard',
					}),
				],
			}),
		],
	})
}
