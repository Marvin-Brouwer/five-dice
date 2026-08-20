import { component } from '@rooted/components'

import type { DiceTuple, DieValue } from '../_logic/gameConstants.ts'
import type { InputFlowStore } from '../_logic/input-flow-store.mts'
import { LiveRegion } from '../../_shared/a11y/live-region.mts'
import { Icon } from '../../_shared/icon/icon.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { Sheet, sheetButton } from '../../_shared/sheet/sheet.mts'

import { DiceKeypad } from './dice-keypad.mts'
import { DiceSlots, type DiceSlotsApi } from './dice-slots.mts'
import { createDiceStore } from './dice-state.mts'
import closeIcon from './dice-modal.close.svg?raw'
import resetIcon from './dice-modal.reset.svg?raw'
import styles from './dice-modal.css'

export type DiceModalOptions = {
	/** Shows while the wizard sits on the 'dice' step. */
	flow: InputFlowStore
	onConfirm: (dice: DiceTuple) => void
	onCancel: () => void
}

/**
 * The roll-entry keypad.
 *
 * A dialog shell only: the slots and the keys are their own components, and
 * everything they share lives in the dice store. Uses a native `<dialog>` so
 * the top layer, the focus trap and Escape all come from the platform.
 */
export const DiceModal = component<DiceModalOptions>({
	name: 'dice-modal',
	styles,
	onMount({ replace, element, create, signal, options, on }) {
		const { flow, onConfirm, onCancel } = options
		const instanceId = Math.random().toString(36).slice(2, 8)
		const titleId = `dice-modal-title-${instanceId}`

		const state = createDiceStore()
		let slots: DiceSlotsApi | undefined

		// LiveRegion hands its element over in its own onMount, which is a
		// microtask after ours, so the first announcement has to be buffered.
		let liveAnnounce: HTMLElement | undefined
		let announcement = ''
		function announce(text: string) {
			announcement = text
			if (liveAnnounce) liveAnnounce.textContent = text
		}

		const bandStatus = element('span', {
			classes: styles.bandStatus,
			textContent: '',
		})

		const context = { element, create }

		const closeButton = sheetButton(context, {
			variant: 'secondary',
			ariaLabel: localization.text`Close and cancel`,
			// Routed through the dialog so Escape and this button take exactly
			// the same path.
			onClick: () => dialog.close(),
			children: [
				create(Icon, { source: closeIcon }),
				element('span', { textContent: localization.text`Close` }),
			],
		})

		const resetButton = sheetButton(context, {
			variant: 'secondary',
			ariaLabel: localization.text`Clear all dice`,
			onClick() {
				state.reset()
				slots?.focus(0)
			},
			children: [
				create(Icon, { source: resetIcon }),
				element('span', { textContent: localization.text`Reset` }),
			],
		})

		const confirmButton = sheetButton(context, {
			variant: 'primary',
			label: localization.text`Confirm`,
			disabled: true,
			onClick: confirm,
		})

		/** True once the roll is complete. */
		function confirm() {
			const tuple = state.asTuple()
			if (!tuple) return
			confirmed = true
			dialog.close()
			onConfirm(tuple)
		}

		/** Distinguishes confirming from dismissing in the `close` handler. */
		let confirmed = false

		let dialog!: HTMLDialogElement
		const sheet = create(Sheet, {
			as: 'dialog',
			variant: 'keypad',
			title: localization.text`Enter your roll`,
			titleId,
			handle: true,
			actionColumns: '1fr 1fr 1.5fr',
			content: [
				create(DiceSlots, { state, ref: (api) => { slots = api } }),
				element('div', {
					classes: styles.band,
					children: [
						element('span', {
							classes: styles.bandLabel,
							textContent: localization.text`Select dice`,
						}),
						bandStatus,
					],
				}),
				create(DiceKeypad, { state }),
				create(LiveRegion, {
					ref: (region) => {
						liveAnnounce = region
						region.textContent = announcement
					},
				}),
			],
			actions: [closeButton, resetButton, confirmButton],
			ref: (el) => {
				dialog = el as HTMLDialogElement
				// Escape, the backdrop and the Close button all land here, so
				// cancelling always reaches the caller.
				dialog.addEventListener('close', () => {
					if (confirmed) return
					state.reset()
					onCancel()
				}, { signal })
				dialog.addEventListener('click', (event) => {
					if (event.target === dialog) dialog.close()
				}, { signal })
			},
		})

		function syncUi() {
			const tuple = state.asTuple()
			const left = state.remaining()
			const focused = state.value.focusedDie
			confirmButton.disabled = tuple === undefined
			confirmButton.textContent = tuple === undefined
				? localization.text`Confirm · ${left} left`
				: localization.text`Confirm`
			bandStatus.textContent = tuple === undefined
				? localization.text`slot ${(focused ?? 0) + 1} next →`
				: localization.text`ready to confirm`
			announce(tuple === undefined
				? localization.text`${5 - left} of 5 dice set`
				: localization.text`All dice set, ready to confirm`)
		}

		// 'update', not 'change': a no-op write still has to repaint.
		state.on('update', signal, syncUi)
		syncUi()

		/**
		 * `flow` fires on every state change, not only this dialog opening, so
		 * track the edge.
		 */
		let shown = false
		function syncOpen() {
			const open = flow.value.step === 'dice'
			if (open === shown) return
			shown = open
			if (open) show()
			else if (dialog.open) {
				confirmed = true   // a step change is not a dismissal
				dialog.close()
				confirmed = false
			}
		}

		function show() {
			// Carry the roll back in when the user pressed Back from the row
			// picker, so the slots repopulate rather than reset.
			state.reset(flow.value.dice as DiceTuple | undefined)
			// Choose where focus lands BEFORE showModal, which otherwise
			// auto-focuses the first focusable child and clobbers this.
			const focused = state.value.focusedDie
			const target = focused === undefined ? confirmButton : undefined
			confirmButton.toggleAttribute('autofocus', target === confirmButton)
			confirmed = false
			if (!dialog.open) dialog.showModal()
			// Re-assert after two frames: showModal's autofocus resolution
			// differs across browsers.
			requestAnimationFrame(() => requestAnimationFrame(() => {
				if (focused === undefined) confirmButton.focus()
				else slots?.focus(focused)
			}))
		}

		syncOpen()
		flow.on('change', signal, syncOpen)

		on('document', 'keydown', (event) => {
			if (!shown) return
			if (event.key >= '1' && event.key <= '6') {
				event.preventDefault()
				state.fill(Number(event.key) as DieValue)
				slots?.focus()
			}
			else if (event.key === 'Enter' && state.asTuple()) {
				event.preventDefault()
				confirm()
			}
		})

		replace(sheet)
	},
})
