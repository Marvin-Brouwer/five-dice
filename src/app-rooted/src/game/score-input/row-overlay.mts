import { component, cssClass } from '@rooted/components'

import { type ScoreField } from '../_logic/gameConstants.ts'
import type { InputFlowStore, InputStep } from '../_logic/input-flow-store.mts'
import type { RowRegistry } from '../score-card/row-registry.mts'
import type { PreviewCell, RowPreview, RowVariant, SelectionMode, SelectionStore } from '../score-card/selection-store.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { Sheet, sheetButton } from '../../_shared/sheet/sheet.mts'
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

		const backdrop = element('div', {
			classes: styles.backdrop,
		})

		const layer = element('section', {
			classes: styles.layer,
			hidden: true,
			aria: {
				labelledBy: titleId
			},
			role: 'dialog',
			children: [
				backdrop,
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

		function enterRow(field: ScoreField, previewCell: PreviewCell | undefined) {
			selection.setHover(field)
			if (previewCell !== undefined) selection.setPreview(field, previewCell)
			// The card has already re-rendered synchronously, so the hit
			// targets can be re-measured against the new row heights.
			repositionLabels()
		}

		function leaveRow() {
			selection.setHover(undefined)
			selection.clearPreview()
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
			fields.forEach(({ field, variant, previewCell }, index) => {
				const radio = element('input', {
					type: 'radio',
					name: radioName,
					value: field,
					classes: styles.radio,
					id: radioId(field),
					on: {
						change() {
							syncConfirm()
						},
						focus() {
							enterRow(field, previewCell)
						},
						blur() {
							leaveRow()
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
							enterRow(field, previewCell)
						},
						mouseleave() {
							leaveRow()
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

		function showOverlay() {
			buildRadios()
			layer.hidden = false
			document.body.style.overflow = 'hidden'
			repositionLabels()
			resizeObserver = new ResizeObserver(() => repositionLabels())
			resizeObserver.observe(document.documentElement)
			syncConfirm()
			queueMicrotask(() => activeRadios[0]?.focus())
		}

		function hideOverlay() {
			layer.hidden = true
			document.body.style.overflow = ''
			resizeObserver?.disconnect()
			resizeObserver = undefined
			// Only clear the selection if this overlay still owns it. Both
			// pickers subscribe to the same flow store and fire in creation
			// order, so stepping back from the flush discard reopens the row
			// picker *before* this one tears down -- an unconditional end()
			// would wipe the state the row picker just set up.
			if (selection.value.mode === mode) selection.end()
			fieldset.replaceChildren()
			activeRadios = []
			activeLabels = []
			confirmButton.disabled = true
		}

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

		on('document', 'keydown', (event) => {
			if (!shown) return
			if (event.key === 'Escape') {
				event.preventDefault()
				onCancel()
			}
			else if (event.key === 'Enter' && selectedField() !== undefined) {
				event.preventDefault()
				confirmButton.click()
			}
		})

		append(layer)
	},
})
