import { component, cssClass } from '@rooted/components'

import { type ScoreField } from '../logic/gameConstants.ts'
import type { InputFlowStore, InputStep } from '../logic/input-flow-store.mts'
import type { RowRegistry } from '../score-card/row-registry.mts'
import type { PreviewCell, RowPreview, RowVariant, SelectionMode, SelectionStore } from '../score-card/selection-store.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { sheetButton } from '../../_shared/sheet/sheet-button.mts'
import { Sheet } from '../../_shared/sheet/sheet.mts'
import { getRowDisplayLabels } from '../score-card/score-card.labels.ts'

import { createRowPreviewArbiter } from './row-preview-arbiter.mts'
import { createRowTargetPositioner } from './row-target-positioner.mts'
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

		const positioner = createRowTargetPositioner({
			rows,
			isShown: () => shown,
		})

		const preview = createRowPreviewArbiter({
			selection,
			selectedField,
			isShown: () => shown,
			// The card has already re-rendered synchronously, so the hit
			// targets can be re-measured against the new row heights.
			onSynced: () => positioner.reposition(),
		})

		function buildRadios() {
			const fields = availableFields()
			fieldset.replaceChildren(
				element('legend', {
					classes: styles.visuallyHidden,
					textContent: title,
				}),
			)
			activeRadios = []
			const labels: HTMLLabelElement[] = []
			const previewCells = new Map<ScoreField, PreviewCell | undefined>()
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
							preview.sync()
						},
						focus() {
							preview.setFocused(field)
							preview.sync()
						},
						blur() {
							// Guarded: focus can land on the next radio before
							// this one is told it lost it.
							preview.clearFocused(field)
							preview.sync()
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
							preview.setHovered(field)
							preview.sync()
						},
						mouseleave() {
							// Guarded: the pointer can enter the next label
							// before this one hears that it left.
							preview.clearHovered(field)
							preview.sync()
						},
					},
				})
				label.dataset.field = field
				if (index === 0) label.dataset.firstOption = 'true'
				activeRadios.push(radio)
				labels.push(label)
				fieldset.append(label)
			})
			positioner.setLabels(labels)
			preview.setCells(previewCells)
			beginSelection(fields)
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
			positioner.reposition()
			resizeObserver = new ResizeObserver(() => positioner.reposition())
			resizeObserver.observe(document.documentElement)
			positioner.trackSettle()
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
			positioner.stop()
			// Only clear the selection if this overlay still owns it. Both
			// pickers subscribe to the same flow store and fire in creation
			// order, so stepping back from the flush discard reopens the row
			// picker *before* this one tears down -- an unconditional end()
			// would wipe the state the row picker just set up.
			if (selection.value.mode === mode) selection.end()
			fieldset.replaceChildren()
			activeRadios = []
			preview.reset()
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
			if (shown) positioner.reposition()
		})

		on('window', 'scroll', () => {
			if (shown) positioner.reposition()
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
