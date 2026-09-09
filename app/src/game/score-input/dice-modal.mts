import { component } from '@rooted/components'

import type { DiceTuple, DieValue } from '../_logic/gameConstants.ts'
import type { InputFlowStore } from '../_logic/input-flow-store.mts'
import type { RowSpan } from '../score-card/row-registry.mts'
import { LiveRegion } from '../../_shared/a11y/live-region.mts'
import { Icon } from '../../_shared/icon/icon.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { scrollPageTo } from '../../_shared/services/page-scroll.mts'
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
	/**
	 * Where the rows the picker will offer sit right now. Read on open, to
	 * scroll them into the strip the sheet leaves free.
	 */
	rowsSpan: () => RowSpan | undefined
	/**
	 * Whether the page is still this dialog's to give back once the wizard
	 * ends. False when the move that ended it handed the scroll to someone
	 * else — the finished game putting its totals on screen — in which case
	 * the reveal is dropped rather than fought over.
	 */
	canRestoreScroll?: () => boolean
	onConfirm: (dice: DiceTuple) => void
	onCancel: () => void
}

/** Breathing room between the revealed rows and the edges of the strip. */
const revealMargin = 12

/**
 * How far the page may have drifted from the reveal and still count as
 * untouched. Covers a smooth scroll caught mid-flight and the sub-pixel
 * rounding a fractional device pixel ratio leaves behind.
 */
const revealTolerance = 2

/**
 * How much of the viewport the row picker's sheet will take.
 *
 * `--sheet-picker-reserve` is declared on the shared `.sheet` base in
 * sheet.css, so it is inherited onto this dialog's own element — no reaching
 * across to the picker, which is closed and unmeasurable at this point
 * anyway. Custom properties resolve without layout, which is what makes
 * reading a hidden component's height possible at all.
 *
 * Read at call time rather than cached at module load: one style lookup per
 * keypad open, and it keeps working if the value ever becomes responsive.
 * Returns undefined when the property is missing — a stylesheet failing to
 * load is not a reason to guess a number and scroll the page by it.
 */
function pickerReserve(sheet: HTMLElement): number | undefined {
	const declared = getComputedStyle(sheet).getPropertyValue('--sheet-picker-reserve')
	const parsed = Number.parseFloat(declared)
	return Number.isFinite(parsed) ? parsed : undefined
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
		const { flow, rowsSpan, canRestoreScroll, onConfirm, onCancel } = options
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
				create(Icon, {
					source: closeIcon,
				}),
				element('span', {
					textContent: localization.text`Close`,
				}),
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
				create(Icon, {
					source: resetIcon,
				}),
				element('span', {
					textContent: localization.text`Reset`,
				}),
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
				create(DiceSlots, {
					state,
					ref: (api) => { slots = api },
				}),
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
				create(DiceKeypad, {
					state,
				}),
				create(LiveRegion, {
					reference(region) {
						liveAnnounce = region
						region.textContent = announcement
					},
				}),
			],
			actions: [
			closeButton,
			resetButton,
			confirmButton,
		],
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
		 * Where the page sat before {@link revealRows} moved it, and where that
		 * move was aimed. Both undefined whenever there is no reveal to undo.
		 */
		let scrollOrigin: number | undefined
		let scrollAim: number | undefined

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
				// A step change is not a dismissal. The flag stays raised until
				// the next show() clears it: close() *queues* its event rather
				// than firing it inline, so clearing it here would always lose
				// the race and make this look like the user pressing Escape.
				confirmed = true
				dialog.close()
			}
		}

		/**
		 * Scroll the rows the picker will offer into the strip above the
		 * sheet, so the next step opens with its hit targets on screen —
		 * and only when they would not be. A viewport the band already fits
		 * in does not move at all. The page stays scrollable behind the
		 * dialog, so this is a nudge the user can scroll away from, not a
		 * lock.
		 *
		 * The strip is measured against the *picker's* sheet, not this one.
		 * The scroll happens while the keypad is up, but what the rows have to
		 * clear is what will be on screen when they are chosen — and the
		 * keypad is well over twice the picker's height, so reserving its own
		 * box scrolled a viewport that already fitted.
		 */
		function revealRows() {
			const span = rowsSpan()
			if (span === undefined) return
			const reserve = pickerReserve(dialog)
			if (reserve === undefined) return
			const strip = window.innerHeight - reserve
			if (strip <= revealMargin * 2) return
			const height = span.bottom - span.top
			const usable = strip - revealMargin * 2
			// Move only as far as it takes to bring the band inside the strip,
			// and not at all when it is already there. Anchoring to the top is
			// for the two cases where that is the best available: the band is
			// taller than the strip, or it is currently clipped above.
			const delta = height > usable || span.top < revealMargin
				? span.top - revealMargin
				: Math.max(0, span.bottom - (strip - revealMargin))
			if (Math.abs(delta) < 1) return
			// Absolute rather than relative, so where this lands is known up
			// front — scrollBy would leave the browser to clamp a delta the
			// page cannot take, and restoring has to know what it aimed at.
			const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
			const aim = Math.min(Math.max(0, window.scrollY + delta), limit)
			if (Math.abs(aim - window.scrollY) < 1) return
			scrollOrigin = window.scrollY
			scrollAim = aim
			scrollPageTo(aim)
		}

		/**
		 * Put the page back where the user was reading before the reveal moved
		 * it, once the wizard is done with it — the rows only had to be on
		 * screen for as long as they were being picked from.
		 *
		 * Skipped when the game has just ended — the totals have the page now
		 * — and when the page is no longer where the reveal left it: the
		 * reveal is a nudge the user can scroll away from, so someone who
		 * scrolled somewhere else meant to be there and does not want it
		 * taken back. Anywhere between here and there still counts as ours,
		 * which is what catches a flow closed mid-scroll.
		 */
		function restoreReveal() {
			const origin = scrollOrigin
			const aim = scrollAim
			scrollOrigin = undefined
			scrollAim = undefined
			if (origin === undefined || aim === undefined) return
			if (canRestoreScroll?.() === false) return
			const low = Math.min(origin, aim) - revealTolerance
			const high = Math.max(origin, aim) + revealTolerance
			if (window.scrollY < low || window.scrollY > high) return
			scrollPageTo(origin)
		}

		function show() {
			// A carried roll means the user pressed Back rather than opening
			// the keypad, and by then they have usually scrolled the card
			// themselves -- so reveal only on a fresh open.
			const fresh = flow.value.dice === undefined
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
				// After focus, and after the sheet has been laid out: both its
				// height and the row positions have to be final to aim this.
				if (fresh) revealRows()
			}))
		}

		/**
		 * The reveal outlives this dialog — it is aimed at the row picker's
		 * viewport, and the picker is the step after this one — so the scroll
		 * is given back when the wizard ends, not when the keypad closes.
		 */
		let active = flow.isActive()
		function syncActive() {
			if (flow.isActive() === active) return
			active = !active
			if (!active) restoreReveal()
		}

		syncOpen()
		flow.on('change', signal, () => {
			syncOpen()
			syncActive()
		})

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
