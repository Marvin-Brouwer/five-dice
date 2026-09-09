import { component } from '@rooted/components'

import type { DieValue } from '../_logic/gameConstants.ts'
import { localization } from '../../_shared/i18n/localization.mts'
import { PipDie } from '../../_shared/die/pip-die.mts'

import { slotIndices, type DiceStore } from './dice-state.mts'
import styles from './dice-slots.css'

export type DiceSlotsApi = {
	/** Move DOM focus to a slot; defaults to whichever slot is next. */
	focus(index?: number): void
}

export type DiceSlotsOptions = {
	state: DiceStore
	/** Handed the focus API once, at mount. */
	ref?: (api: DiceSlotsApi) => void
}

type Painted = { value: DieValue | undefined, focused: boolean }

function slotLabel(index: number, value: DieValue | undefined, focused: boolean): string {
	if (value !== undefined) return localization.text`Slot ${index + 1}: ${value}`
	return focused
		? localization.text`Slot ${index + 1}: next`
		: localization.text`Slot ${index + 1}: empty`
}

/**
 * The five entry slots.
 *
 * DOM focus follows `focusedDie` rather than being pushed around by every
 * caller, so the keypad and the action bar move focus by issuing a store
 * command instead of reaching in here.
 */
export const DiceSlots = component<DiceSlotsOptions>({
	name: 'dice-slots',
	styles,
	onMount({ replace, element, create, signal, options }) {
		const { state, ref } = options

		const dieSpaces: HTMLSpanElement[] = []
		const buttons = slotIndices.map((index) => {
			const dieSpace = element('span', {
				classes: styles.slotDie,
			})
			dieSpaces.push(dieSpace)
			return element('button', {
				type: 'button',
				classes: styles.slot,
				children: [
					dieSpace,
					element('span', {
						classes: styles.slotLabel,
						textContent: String(index + 1).padStart(2, '0'),
					}),
				],
				on: {
					click() {
						state.focusSlot(index)
					},
					keydown(event) {
						if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
							event.preventDefault()
							state.moveFocus(1)
						}
						else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
							event.preventDefault()
							state.moveFocus(-1)
						}
						else if (event.key === 'Backspace' || event.key === 'Delete') {
							event.preventDefault()
							state.clearSlot(index)
						}
					},
				},
			})
		})

		function focusSlot(index?: number) {
			const target = index ?? state.value.focusedDie ?? 0
			buttons[target]?.focus()
		}

		/** What each slot currently shows, so only real changes are rebuilt. */
		const painted: Array<Painted | undefined> = slotIndices.map(() => undefined)

		function render() {
			const { dice, focusedDie } = state.value
			const focusWasOnASlot = buttons.some(button => button === document.activeElement)

			for (const index of slotIndices) {
				const value = dice[index]
				const focused = index === focusedDie
				const was = painted[index]
				if (was !== undefined && was.value === value && was.focused === focused) continue

				const label = slotLabel(index, value, focused)
				// PipDie renders once at mount and has no update path, so it
				// has to be recreated -- but only for the slots that changed.
				dieSpaces[index]!.replaceChildren(create(PipDie, {
					value,
					variant: focused ? 'active' : 'default',
					ariaLabel: label,
				}))
				buttons[index]!.setAttribute('aria-label', label)
				buttons[index]!.classList.toggle(styles.slotActive!, focused)
				painted[index] = {
				value,
				focused,
			}
			}

			// Keep DOM focus with the store, but only while the user is
			// already in the slot row -- otherwise this would steal focus from
			// the keypad or Confirm. Without it, Backspace moved the store's
			// focus and left the caret on the slot it had just cleared.
			if (focusWasOnASlot && focusedDie !== undefined && buttons[focusedDie] !== document.activeElement) {
				buttons[focusedDie]!.focus()
			}
		}

		render()
		// 'update', not 'change': clearing an already-empty slot is a no-op
		// write that still has to repaint.
		state.on('update', signal, render)
		ref?.({ focus: focusSlot })

		replace(element('div', {
			role: 'group',
			aria: {
				label: localization.text`Your five dice`,
			},
			classes: styles.slotsRow,
			children: buttons,
		}))
	},
})
