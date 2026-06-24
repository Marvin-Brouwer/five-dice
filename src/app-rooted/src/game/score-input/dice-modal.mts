import { component, cssClass } from '@rooted/components'
import { createStore, type Store } from '@rooted/store'

import { type DieValue } from '../_logic/gameConstants.ts'
import { Dialog } from '../../_shared/dialog/dialog.mts'

import styles from './dice-modal.css'

export type DiceTuple = [DieValue, DieValue, DieValue, DieValue, DieValue]

export type DiceModalOptions = {
	open: Store<boolean>
	onConfirm: (dice: DiceTuple) => void
	onCancel: () => void
}

const dieValues: DieValue[] = [1, 2, 3, 4, 5, 6]
const slotIndices = [0, 1, 2, 3, 4] as const

type InputDice = Array<DieValue | undefined>

function emptyDice(): InputDice {
	return [undefined, undefined, undefined, undefined, undefined]
}

function nextEmpty(dice: InputDice, after: number): number | undefined {
	for (let offset = 1; offset <= dice.length; offset++) {
		const idx = (after + offset) % dice.length
		if (dice[idx] === undefined) return idx
	}
	return undefined
}

function asTuple(dice: InputDice): DiceTuple | undefined {
	if (dice.some(d => d === undefined)) return undefined
	return dice.slice() as DiceTuple
}

export const DiceModal = component<DiceModalOptions>({
	name: 'dice-modal',
	styles,
	onMount({ append, element, create, signal, options, on }) {
		const { open, onConfirm, onCancel } = options
		const state = createStore<{ dice: InputDice, focusedDie: number }>({
			dice: emptyDice(),
			focusedDie: 0,
		})

		const titleId = 'dice-modal-title'

		const slotButtons: HTMLButtonElement[] = slotIndices.map((idx) => element('button', {
			type: 'button',
			classes: styles.slot,
			aria: { label: `Die ${idx + 1}, empty` },
			textContent: '—',
			on: {
				click() {
					state.update(s => { s.focusedDie = idx })
					slotButtons[idx]!.focus()
				},
				keydown(event) {
					if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
						event.preventDefault()
						const next = (idx + 1) % slotIndices.length
						state.update(s => { s.focusedDie = next })
						slotButtons[next]!.focus()
					}
					else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
						event.preventDefault()
						const prev = (idx - 1 + slotIndices.length) % slotIndices.length
						state.update(s => { s.focusedDie = prev })
						slotButtons[prev]!.focus()
					}
					else if (event.key === 'Backspace' || event.key === 'Delete') {
						event.preventDefault()
						state.update(s => { s.dice[idx] = undefined })
					}
				},
			},
		}))

		function fillFocused(value: DieValue) {
			state.update(s => {
				const idx = s.focusedDie
				s.dice[idx] = value
				const next = nextEmpty(s.dice, idx)
				if (next !== undefined) s.focusedDie = next
			})
			const focused = state.value.focusedDie
			slotButtons[focused]?.focus()
		}

		const keypadButtons: HTMLButtonElement[] = dieValues.map(value => element('button', {
			type: 'button',
			classes: styles.keypadButton,
			textContent: String(value),
			aria: { label: `Set die to ${value}` },
			on: {
				click() { fillFocused(value) },
			},
		}))

		const liveRegion = element('p', {
			classes: styles.liveRegion,
			aria: { live: 'polite', atomic: 'true' },
		})

		const cancelButton = element('button', {
			type: 'button',
			classes: styles.cancelButton,
			textContent: 'Cancel',
			on: {
				click() {
					closeReset()
					onCancel()
				},
			},
		})

		const confirmButton = element('button', {
			type: 'submit',
			classes: styles.confirmButton,
			textContent: 'Confirm dice',
			disabled: true,
			on: {
				click(event) {
					event.preventDefault()
					const tuple = asTuple(state.value.dice as InputDice)
					if (!tuple) return
					closeReset()
					onConfirm(tuple)
				},
			},
		})

		function closeReset() {
			if (open.value) open.update(() => false)
			state.update(s => {
				s.dice = emptyDice()
				s.focusedDie = 0
			})
		}

		function syncUi() {
			const { dice, focusedDie } = state.value
			slotIndices.forEach((idx) => {
				const btn = slotButtons[idx]!
				const value = dice[idx]
				btn.textContent = value === undefined ? '—' : String(value)
				btn.setAttribute('aria-label', value === undefined ? `Die ${idx + 1}, empty` : `Die ${idx + 1}, ${value}`)
				btn.classList.toggle(styles.focused!, idx === focusedDie)
			})
			const tuple = asTuple(dice as InputDice)
			confirmButton.disabled = tuple === undefined
			liveRegion.textContent = tuple === undefined
				? `${dice.filter(d => d !== undefined).length} of 5 dice set`
				: 'All dice set, ready to confirm'
		}

		state.on('update', signal, syncUi)
		syncUi()

		open.on('change', signal, ({ detail }) => {
			if (!detail.state) return
			state.update(s => {
				s.dice = emptyDice()
				s.focusedDie = 0
			})
			queueMicrotask(() => slotButtons[0]?.focus())
		})

		on('document', 'keydown', (event) => {
			if (!open.value) return
			if (event.target instanceof HTMLButtonElement && event.target.classList.contains(styles.keypadButton!) && event.key === ' ') return
			if (event.key >= '1' && event.key <= '6') {
				event.preventDefault()
				fillFocused(Number(event.key) as DieValue)
			}
			else if (event.key === 'Enter' && asTuple(state.value.dice as InputDice)) {
				event.preventDefault()
				confirmButton.click()
			}
		})

		const form = element('form', {
			classes: styles.form,
			on: {
				submit(event) { event.preventDefault() },
			},
			children: [
				element('h2', {
					id: titleId,
					classes: styles.title,
					textContent: 'Enter your roll',
				}),
				element('fieldset', {
					classes: styles.diceFieldset,
					children: [
						element('legend', {
							classes: styles.legend,
							textContent: 'Dice',
						}),
						element('div', {
							classes: styles.slots,
							children: slotButtons,
						}),
					],
				}),
				element('fieldset', {
					classes: styles.keypadFieldset,
					children: [
						element('legend', {
							classes: styles.legend,
							textContent: 'Pick a value (1–6)',
						}),
						element('div', {
							classes: styles.keypad,
							children: keypadButtons,
						}),
					],
				}),
				liveRegion,
				element('div', {
					classes: styles.actions,
					children: [cancelButton, confirmButton],
				}),
			],
		})

		append(
			create(Dialog, {
				open,
				label: 'Enter your roll',
				labelId: titleId,
				onClose() {
					if (open.value) onCancel()
					state.update(s => {
						s.dice = emptyDice()
						s.focusedDie = 0
					})
				},
				children: form,
			}),
		)

		// noop reference to keep cssClass importable for future conditional classes
		void cssClass
	},
})
