import { component } from '@rooted/components'
import { createStore, type Store } from '@rooted/store'

import { type DieValue } from '../_logic/gameConstants.ts'
import { Icon } from '../../_shared/icon/icon.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { PipDie } from '../../_shared/die/pip-die.mts'

import closeIcon from './dice-modal.close.svg?raw'
import resetIcon from './dice-modal.reset.svg?raw'
import styles from './dice-modal.css'

export type DiceTuple = [DieValue, DieValue, DieValue, DieValue, DieValue]

export type DiceModalOptions = {
	open: Store<boolean>
	/** When re-opened after Back from the row selector, populate the slots
	    with the previously-entered dice instead of resetting. */
	initialDice?: () => DiceTuple | undefined
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

function firstEmpty(dice: InputDice): number | undefined {
	for (let idx = 0; idx < dice.length; idx++) {
		if (dice[idx] === undefined) return idx
	}
	return undefined
}

function asTuple(dice: InputDice): DiceTuple | undefined {
	if (dice.some(d => d === undefined)) return undefined
	return dice.slice() as DiceTuple
}

// TODO split into more component based approach
export const DiceModal = component<DiceModalOptions>({
	name: 'dice-modal',
	styles,
	onMount({ append, element, create, signal, options, on }) {
		const { open, initialDice, onConfirm, onCancel } = options
		// TODO useless function, remove
		const makeDieNode = (value: DieValue | undefined, size: number, variant: 'default' | 'active' | 'muted', ariaLabel?: string): Node =>
			create(PipDie, { value, size, variant, ariaLabel })

		const state = createStore<{ dice: InputDice, focusedDie: number }>({
			dice: emptyDice(),
			focusedDie: 0,
		})

		// todo, move to module scope
		const titleId = 'dice-modal-title'

		// Slot buttons: a die face + tiny "01"..."05" label below
		const slotButtons: HTMLButtonElement[] = slotIndices.map((idx) => {
			const dieSpace = element('span', { classes: styles.slotDie })
			const button = element('button', {
				type: 'button',
				classes: styles.slot,
				aria: {
					label: localization.text`Slot ${idx + 1}: empty`
				},
				children: [
					dieSpace,
					element('span', {
						classes: styles.slotLabel,
						textContent: String(idx + 1).padStart(2, '0'),
					}),
				],
				on: {
					click() {
						state.update(s => { s.focusedDie = idx })
						slotButtons[idx]!.focus()
					},
					keydown(event) {
						// todo, this looks like something that might be moved into a function in component scope
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
							state.update(s => {
								s.dice[idx] = undefined
								const next = firstEmpty(s.dice)
								if (next !== undefined) s.focusedDie = next
							})
						}
					},
				},
			})
			return button
		})

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

		// Keypad buttons: 6 die faces (pip pattern IS the label)
		const keypadButtons: HTMLButtonElement[] = dieValues.map((value) => {
			const dieSpace = element('span', { classes: styles.keyDie })
			dieSpace.append(makeDieNode(value, 40, 'default', localization.text`Add a ${value}`))
			return element('button', {
				type: 'button',
				classes: styles.keypadButton,
				aria: {
					label: localization.text`Add a ${value}`
				},
				children: dieSpace,
				on: {
					click() { fillFocused(value) },
				},
			})
		})

		const liveRegion = element('p', {
			classes: styles.liveRegion,
			aria: {
				live: 'polite',
				atomic: 'true'
			},
		})

		// Section band between slots and keys
		const bandStatus = element('span', {
			classes: styles.bandStatus,
			textContent: '',
		})
		const band = element('div', {
			classes: styles.band,
			children: [
				element('span', {
					classes: styles.bandLabel,
					textContent: localization.text`Select dice`,
				}),
				bandStatus,
			],
		})

		function closeReset() {
			if (open.value) open.update(() => false)
			state.update(s => {
				s.dice = emptyDice()
				s.focusedDie = 0
			})
		}

		const closeButton = element('button', {
			type: 'button',
			classes: [styles.actionButton, styles.actionSecondary],
			aria: {
				label: localization.text`Close and cancel`
			},
			on: {
				click() {
					closeReset()
					onCancel()
				},
			},
			children: [
				create(Icon, {
					source: closeIcon,
				}),
				element('span', {
					textContent: localization.text`Close`,
				}),
			],
		})

		const resetButton = element('button', {
			type: 'button',
			classes: [styles.actionButton, styles.actionSecondary],
			aria: {
				label: localization.text`Clear all dice`
			},
			on: {
				click() {
					state.update(s => {
						s.dice = emptyDice()
						s.focusedDie = 0
					})
					slotButtons[0]?.focus()
				},
			},
			children: [
				create(Icon, {
					source: resetIcon,
				}),
				element('span', {
					textContent: localization.text`Reset`,
				}),
			],
		})

		const confirmButton = element('button', {
			type: 'button',
			classes: [styles.actionButton, styles.actionPrimary],
			textContent: localization.text`Confirm`,
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

		// Slot die refresh: swap the pip svg on state change
		function refreshSlotDies() {
			const { dice, focusedDie } = state.value
			slotIndices.forEach((idx) => {
				const btn = slotButtons[idx]!
				const value = dice[idx]
				const dieSpace = btn.firstElementChild as HTMLSpanElement
				dieSpace.replaceChildren(makeDieNode(
					value,
					50,
					idx === focusedDie ? 'active' : 'default',
					value === undefined ? localization.text`Slot ${idx + 1}: empty` : localization.text`Slot ${idx + 1}: ${value}`,
				))
				const ariaLabel = value === undefined
					? (idx === focusedDie ? localization.text`Slot ${idx + 1}: next` : localization.text`Slot ${idx + 1}: empty`)
					: localization.text`Slot ${idx + 1}: ${value}`
				btn.setAttribute('aria-label', ariaLabel)
				btn.classList.toggle(styles.slotActive!, idx === focusedDie)
			})
		}

		function syncUi() {
			refreshSlotDies()
			const { dice, focusedDie } = state.value
			const setCount = dice.filter(d => d !== undefined).length
			const tuple = asTuple(dice as InputDice)
			confirmButton.disabled = tuple === undefined
			confirmButton.textContent = tuple === undefined
				? localization.text`Confirm · ${5 - setCount} left`
				: localization.text`Confirm`
			bandStatus.textContent = tuple === undefined
				? localization.text`slot ${focusedDie + 1} next →`
				: localization.text`ready to confirm`
			liveRegion.textContent = tuple === undefined
				? localization.text`${setCount} of 5 dice set`
				: localization.text`All dice set, ready to confirm`
		}

		state.on('update', signal, syncUi)
		syncUi()

		const dialog = element('dialog', {
			classes: styles.sheet,
			aria: { modal: 'true', labelledBy: titleId },
			on: {
				close() {
					if (open.value) open.update(() => false)
				},
				click(event) {
					if (event.target === dialog) dialog.close()
				},
			},
		})

		const handle = element('span', {
			classes: styles.handle,
			aria: { hidden: 'true' },
		})

		const srTitle = element('h2', {
			id: titleId,
			classes: styles.srTitle,
			textContent: localization.text`Enter your roll`,
		})

		const slotsRow = element('div', {
			role: 'group',
			aria: { label: localization.text`Your five dice` },
			classes: styles.slotsRow,
			children: slotButtons,
		})

		const keysRow = element('div', {
			role: 'group',
			aria: { label: localization.text`Dice keys` },
			classes: styles.keysRow,
			children: keypadButtons,
		})

		const actionsRow = element('div', {
			classes: styles.actionsRow,
			children: [closeButton, resetButton, confirmButton],
		})

		dialog.append(
			handle,
			srTitle,
			slotsRow,
			band,
			keysRow,
			actionsRow,
			liveRegion,
		)

		open.on('change', signal, ({ detail }) => {
			if (detail.state) {
				const carry = initialDice?.()
				state.update(s => {
					s.dice = carry ? (Array.from(carry) as InputDice) : emptyDice()
					const first = firstEmpty(s.dice)
					// -1 means "no active slot", used when the tuple is
					// already complete so no slot gets the accent border.
					s.focusedDie = first ?? -1
				})
				// Pick where the initial focus should land BEFORE showing the
				// dialog. showModal auto-focuses the first focusable child,
				// which otherwise clobbers our post-open focus() call.
				const complete = asTuple(state.value.dice as InputDice) !== undefined
				const focusTarget = complete
					? confirmButton
					: slotButtons[state.value.focusedDie]
				slotButtons.forEach(b => b.removeAttribute('autofocus'))
				confirmButton.removeAttribute('autofocus')
				focusTarget?.setAttribute('autofocus', '')
				if (!dialog.open) dialog.showModal()
				// Also re-focus after two frames in case showModal's autofocus
				// resolution differs across browsers.
				requestAnimationFrame(() => requestAnimationFrame(() => focusTarget?.focus()))
			}
			else if (dialog.open) {
				dialog.close()
			}
		})

		if (open.value && !dialog.open) queueMicrotask(() => { if (open.value) dialog.showModal() })

		on('document', 'keydown', (event) => {
			if (!open.value) return
			if (event.key >= '1' && event.key <= '6') {
				event.preventDefault()
				fillFocused(Number(event.key) as DieValue)
			}
			else if (event.key === 'Enter' && asTuple(state.value.dice as InputDice)) {
				event.preventDefault()
				confirmButton.click()
			}
		})

		append(dialog)
	},
})
