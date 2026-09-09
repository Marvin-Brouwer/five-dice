import { component, cssClass } from '@rooted/components'

import { type ScoreField } from '../logic/gameConstants.ts'
import type { InputFlowStore, InputStep } from '../logic/input-flow-store.mts'
import type { RowRegistry } from '../score-card/row-registry.mts'
import type { PreviewCell, RowPreview, RowVariant, SelectionMode, SelectionStore } from '../score-card/selection-store.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { sheetButton } from '../../_shared/sheet/sheet-button.mts'
import { Sheet } from '../../_shared/sheet/sheet.mts'
import { getRowDisplayLabels } from '../score-card/score-card.labels.ts'

import styles from './row-overlay.css'

export type RowOverlayField = {
	field: ScoreField
	variant: RowVariant
	/**
	 * What the pad cell would hold if this row were confirmed. The score card
	 * renders it through its normal row renderer, so the preview and the
	 * committed result cannot drift apart. Omit to preview nothing.
	 */
	previewCell?: PreviewCell
}

export type RowOverlayOptions = {
	/** The wizard's position; this overlay shows while it sits on `step`. */
	flow: InputFlowStore
	step: Extract<InputStep, 'row' | 'flushDiscard'>
	mode: SelectionMode
	title: string
	availableFields: () => RowOverlayField[]
	/** Written to as the user moves over rows; the score card renders from it. */
	selection: SelectionStore
	/**
	 * A preview to show for the whole step, independent of the pointer. The
	 * flush-discard step uses it to show the flush being committed while the
	 * user picks what to sacrifice for it.
	 */
	pinnedPreview?: () => RowPreview | undefined
	/** Where each row is on screen, so the hit targets can be placed over them. */
	rows: RowRegistry
	onConfirm: (field: ScoreField) => void
	onCancel: () => void
}

export const RowOverlay = component<RowOverlayOptions>({
	name: 'row-overlay',
	styles,
	onMount({ append, element, create, signal, options, on }) {
		const { flow, step, mode, title, availableFields, pinnedPreview, selection, rows, onConfirm, onCancel } = options
		const instanceId = Math.random().toString(36).slice(2, 8)
		const titleId = `row-overlay-title-${instanceId}`
		const radioName = `row-overlay-selection-${instanceId}`
		const radioId = (field: ScoreField) => `row-overlay-radio-${instanceId}-${field}`

		const fieldset = element('fieldset', {
			classes: styles.fieldset,
			aria: {
				labelledBy: titleId
			},
		})

		const context = { element, create }

		const cancelButton = sheetButton(context, {
			variant: 'secondary',
			label: localization.text`Back`,
			onClick: onCancel,
		})

		const confirmButton = sheetButton(context, {
			variant: 'primary',
			label: mode === 'discard'
				? localization.text`Discard`
				: localization.text`Confirm`,
			disabled: true,
			onClick() {
				const selected = selectedField()
				if (selected === undefined) return
				onConfirm(selected)
			},
		})

		const sheet = create(Sheet, {
			as: 'div',
			variant: 'picker',
			title,
			titleId,
			titleVisible: true,
			content: [],
			actions: [cancelButton, confirmButton],
		})

		/**
		 * A native modal dialog, so the focus trap, the background's
		 * inertness, the top layer and Escape all come from the platform
		 * rather than being re-implemented here.
		 *
		 * The hit targets are children of this dialog, not of the score card,
		 * so putting it in the top layer lifts them with it — they still sit
		 * at the rows' viewport coordinates, now above an inert card. The
		 * backdrop is `::backdrop`, which the top layer already paints in the
		 * right place.
		 */
		const layer = element('dialog', {
			classes: styles.layer,
			aria: {
				labelledBy: titleId
			},
			children: [
				fieldset,
				sheet
			],
		})

		let activeRadios: HTMLInputElement[] = []
		let activeLabels: HTMLLabelElement[] = []
		let resizeObserver: ResizeObserver | undefined
		function selectedField(): ScoreField | undefined {
			const checked = activeRadios.find(r => r.checked)
			return checked?.value as ScoreField | undefined
		}

		function syncConfirm() {
			confirmButton.disabled = selectedField() === undefined
		}

		/**
		 * The overlay proposes; the score card renders. Everything below is a
		 * write to the selection store — this component never touches the
		 * card's DOM.
		 */
		function beginSelection(fields: RowOverlayField[]) {
			const targets: Partial<Record<ScoreField, RowVariant>> = {}
			for (const { field, variant } of fields) targets[field] = variant
			selection.begin(mode, targets, pinnedPreview?.())
		}

		/**
		 * What each row would become, by field, so the preview can be rebuilt
		 * from whichever row is current without the event that asked for it
		 * having to carry the cell along.
		 */
		const previewCells = new Map<ScoreField, PreviewCell | undefined>()
		let hoveredField: ScoreField | undefined
		let focusedField: ScoreField | undefined

		/**
		 * The row the preview belongs to: what the pointer is over, else what
		 * holds keyboard focus, else whatever is actually checked.
		 *
		 * The checked row is the load-bearing fallback. Safari does not focus
		 * a radio when its label is tapped, so on iOS the first tap fires
		 * `mouseenter` on the tapped label and then blurs the radio the dialog
		 * autofocused, with no `focus` on the tapped one to follow. Keyed to
		 * hover and focus alone, that blur wiped the preview the tap had just
		 * set and the row fell back to its empty rendering -- a bare `.` where
		 * the dice belong -- until the next tap. Chrome focuses the radio, so
		 * it never showed there.
		 */
		function previewField(): ScoreField | undefined {
			return hoveredField ?? focusedField ?? selectedField()
		}

		function syncPreview() {
			// Teardown blurs a radio as the dialog closes; that must not write
			// selection state back after this overlay has handed it over.
			if (!shown) return
			const field = previewField()
			const previewCell = field === undefined ? undefined : previewCells.get(field)
			selection.setHover(field)
			if (field !== undefined && previewCell !== undefined) selection.setPreview(field, previewCell)
			else selection.clearPreview()
			// The card has already re-rendered synchronously, so the hit
			// targets can be re-measured against the new row heights.
			repositionLabels()
		}

		function buildRadios() {
			const fields = availableFields()
			fieldset.replaceChildren(
				element('legend', {
					classes: styles.visuallyHidden,
					textContent: title,
				}),
			)
			activeRadios = []
			activeLabels = []
			previewCells.clear()
			hoveredField = undefined
			focusedField = undefined
			fields.forEach(({ field, variant, previewCell }, index) => {
				previewCells.set(field, previewCell)
				const radio = element('input', {
					type: 'radio',
					name: radioName,
					value: field,
					classes: styles.radio,
					id: radioId(field),
					on: {
						change() {
							syncConfirm()
							// Checking a row is intent enough to preview it,
							// whether or not the browser moved focus along
							// with the click.
							syncPreview()
						},
						focus() {
							focusedField = field
							syncPreview()
						},
						blur() {
							// Guarded: focus can land on the next radio before
							// this one is told it lost it.
							if (focusedField === field) focusedField = undefined
							syncPreview()
						},
					},
				})
				const label = element('label', {
					htmlFor: radioId(field),
					classes: [
						styles.option,
						cssClass(variant === 'valid', styles.optionValid),
						cssClass(variant !== 'valid', styles.optionDiscard),
					],
					aria: {
						label: localization.text`${getRowDisplayLabels()[field].title}, ${variant === 'valid' ? localization.text`apply` : localization.text`discard`}`
					},
					children: radio,
					on: {
						mouseenter() {
							hoveredField = field
							syncPreview()
						},
						mouseleave() {
							// Guarded: the pointer can enter the next label
							// before this one hears that it left.
							if (hoveredField === field) hoveredField = undefined
							syncPreview()
						},
					},
				})
				label.dataset.field = field
				if (index === 0) label.dataset.firstOption = 'true'
				activeRadios.push(radio)
				activeLabels.push(label)
				fieldset.append(label)
			})
			beginSelection(fields)
		}

		function repositionLabels() {
			activeLabels.forEach((label) => {
				const field = label.dataset.field as ScoreField | undefined
				if (!field) return
				const rect = rows.rect(field)
				if (rect === undefined) {
					label.style.display = 'none'
					return
				}
				label.style.display = ''
				label.style.left = `${rect.left}px`
				label.style.top = `${rect.top}px`
				label.style.width = `${rect.width}px`
				label.style.height = `${rect.height}px`
			})
		}

		let settleFrame: number | undefined

		/**
		 * Keep re-measuring until the page stops moving under the overlay.
		 *
		 * The keypad scrolls the rows the picker will offer into view with a
		 * *smooth* scroll -- and hands the scroll back the same way once the
		 * wizard ends -- so the picker can open while the page is still
		 * travelling and take its measurements mid-flight. A hit target left
		 * at a stale offset covers the wrong row, and a pick then reacts on a
		 * row the player did not touch while the one they did touch stays
		 * empty.
		 *
		 * The window `scroll` listener already covers this wherever it fires
		 * for every frame of a smooth scroll; this covers the frames where it
		 * does not. Self-terminating: a few still frames, or a second and a
		 * half, whichever comes first.
		 */
		function trackScrollSettle() {
			const deadline = performance.now() + 1500
			let previous = window.scrollY
			let stillFrames = 0

			function step() {
				settleFrame = undefined
				if (!shown) return
				repositionLabels()
				stillFrames = window.scrollY === previous ? stillFrames + 1 : 0
				previous = window.scrollY
				if (stillFrames >= 3 || performance.now() > deadline) return
				settleFrame = requestAnimationFrame(step)
			}

			settleFrame = requestAnimationFrame(step)
		}

		function stopScrollSettle() {
			if (settleFrame !== undefined) cancelAnimationFrame(settleFrame)
			settleFrame = undefined
		}

		/**
		 * Set while this overlay closes its own dialog for a step change, so
		 * the `close` handler can tell that apart from the user dismissing it
		 * with Escape.
		 *
		 * The handler is what clears it, and that is load-bearing: `close()`
		 * *queues* the close event rather than firing it inline, so resetting
		 * the flag on the line after `close()` would always lose the race and
		 * make every step change look like a dismissal.
		 */
		let programmaticClose = false

		// Escape is the platform's to handle now. It lands here, and takes the
		// same path as the Back button so cancelling always reaches the caller.
		layer.addEventListener('close', () => {
			const dismissed = !programmaticClose
			programmaticClose = false
			if (dismissed) onCancel()
		}, { signal })

		function showOverlay() {
			buildRadios()
			if (!layer.open) layer.showModal()
			repositionLabels()
			resizeObserver = new ResizeObserver(() => repositionLabels())
			resizeObserver.observe(document.documentElement)
			trackScrollSettle()
			syncConfirm()
			// showModal autofocuses the first focusable child, which is already
			// this radio -- asserted anyway, because that resolution differs
			// between browsers.
			queueMicrotask(() => activeRadios[0]?.focus())
		}

		function hideOverlay() {
			if (layer.open) {
				programmaticClose = true
				layer.close()
			}
			resizeObserver?.disconnect()
			resizeObserver = undefined
			stopScrollSettle()
			// Only clear the selection if this overlay still owns it. Both
			// pickers subscribe to the same flow store and fire in creation
			// order, so stepping back from the flush discard reopens the row
			// picker *before* this one tears down -- an unconditional end()
			// would wipe the state the row picker just set up.
			if (selection.value.mode === mode) selection.end()
			fieldset.replaceChildren()
			activeRadios = []
			activeLabels = []
			previewCells.clear()
			hoveredField = undefined
			focusedField = undefined
			confirmButton.disabled = true
		}

		// Before the first syncOpen, because showModal() throws on an element
		// that is not in the document.
		append(layer)

		// `flow` fires on every state change, not just this overlay opening,
		// so track the edge — otherwise moving to the next step would rebuild
		// an overlay that is already showing.
		let shown = false
		function syncOpen() {
			const open = flow.value.step === step
			if (open === shown) return
			shown = open
			if (open) showOverlay()
			else hideOverlay()
		}
		syncOpen()
		flow.on('change', signal, syncOpen)

		on('window', 'resize', () => {
			if (shown) repositionLabels()
		})

		on('window', 'scroll', () => {
			if (shown) repositionLabels()
		})

		// Escape is no longer handled here: a modal dialog dismisses itself and
		// reports it through the `close` listener above.
		on('document', 'keydown', (event) => {
			if (!shown) return
			if (event.key === 'Enter' && selectedField() !== undefined) {
				event.preventDefault()
				confirmButton.click()
			}
		})
	},
})
