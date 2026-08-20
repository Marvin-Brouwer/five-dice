import { component, cssClass } from '@rooted/components'
import { type Store } from '@rooted/store'

import { type ScoreField } from '../_logic/gameConstants.ts'
import type { RowRegistry } from '../score-card/row-registry.mts'
import type { PreviewCell, RowVariant, SelectionMode, SelectionStore } from '../score-card/selection-store.mts'
import { localization } from '../../_shared/i18n/localization.mts'
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
	open: Store<boolean>
	mode: SelectionMode
	title: string
	availableFields: () => RowOverlayField[]
	/** Written to as the user moves over rows; the score card renders from it. */
	selection: SelectionStore
	/** Where each row is on screen, so the hit targets can be placed over them. */
	rows: RowRegistry
	onConfirm: (field: ScoreField) => void
	onCancel: () => void
}

export const RowOverlay = component<RowOverlayOptions>({
	name: 'row-overlay',
	styles,
	onMount({ append, element, create, signal, options, on }) {
		const { open, mode, title, availableFields, selection, rows, onConfirm, onCancel } = options
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

		const titleEl = element('p', {
			id: titleId,
			classes: styles.title,
			textContent: title,
		})

		const cancelButton = element('button', {
			type: 'button',
			classes: [
				styles.actionButton,
				styles.actionSecondary
			],
			textContent: localization.text`Back`,
			on: {
				click() {
					closeOverlay()
					onCancel()
				},
			},
		})

		const confirmButton = element('button', {
			type: 'button',
			classes: [
				styles.actionButton,
				styles.actionPrimary
			],
			textContent: mode === 'discard'
				? localization.text`Discard`
				: localization.text`Confirm`,
			disabled: true,
			on: {
				click() {
					const selected = selectedField()
					if (selected === undefined) return
					const target = selected
					closeOverlay()
					onConfirm(target)
				},
			},
		})

		const actionsRow = element('div', {
			classes: styles.actionsRow,
			children: [
				cancelButton,
				confirmButton
			],
		})

		const sheet = element('div', {
			classes: styles.sheet,
			children: [
				titleEl,
				actionsRow
			],
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
			selection.begin(mode, targets)
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
						cssClass(styles.optionValid, variant === 'valid'),
						cssClass(styles.optionDiscard, variant !== 'valid'),
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

		function closeOverlay() {
			if (!open.value) return
			open.update(() => false)
		}

		function hideOverlay() {
			layer.hidden = true
			document.body.style.overflow = ''
			resizeObserver?.disconnect()
			resizeObserver = undefined
			selection.end()
			fieldset.replaceChildren()
			activeRadios = []
			activeLabels = []
			confirmButton.disabled = true
		}

		open.on('change', signal, ({ detail }) => {
			if (detail.state) showOverlay()
			else hideOverlay()
		})

		on('window', 'resize', () => {
			if (open.value) repositionLabels()
		})

		on('window', 'scroll', () => {
			if (open.value) repositionLabels()
		})

		on('document', 'keydown', (event) => {
			if (!open.value) return
			if (event.key === 'Escape') {
				event.preventDefault()
				closeOverlay()
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
