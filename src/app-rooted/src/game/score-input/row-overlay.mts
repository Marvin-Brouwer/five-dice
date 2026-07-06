import { component } from '@rooted/components'
import { type Store } from '@rooted/store'

import { type ScoreField } from '../_logic/gameConstants.ts'
import { rowDisplayLabels } from '../score-card/score-card.labels.ts'

import styles from './row-overlay.css'

export type RowOverlayField = {
	field: ScoreField
	variant: 'valid' | 'discard'
	preview?: string
}

export type RowOverlayOptions = {
	open: Store<boolean>
	mode: 'apply' | 'discard'
	title: string
	availableFields: () => RowOverlayField[]
	onConfirm: (field: ScoreField) => void
	onCancel: () => void
}

const SCORE_CARD_ID = 'score-card'

export const RowOverlay = component<RowOverlayOptions>({
	name: 'row-overlay',
	styles,
	onMount({ append, element, signal, options, on }) {
		const { open, mode, title, availableFields, onConfirm, onCancel } = options
		const instanceId = Math.random().toString(36).slice(2, 8)
		const titleId = `row-overlay-title-${instanceId}`
		const radioName = `row-overlay-selection-${instanceId}`
		const radioId = (field: ScoreField) => `row-overlay-radio-${instanceId}-${field}`

		const fieldset = element('fieldset', {
			classes: styles.fieldset,
			aria: { labelledBy: titleId },
		})

		const titleEl = element('p', {
			id: titleId,
			classes: styles.title,
			textContent: title,
		})

		const cancelButton = element('button', {
			type: 'button',
			classes: [styles.actionButton, styles.actionSecondary],
			textContent: 'Cancel',
			on: {
				click() {
					closeOverlay()
					onCancel()
				},
			},
		})

		const confirmButton = element('button', {
			type: 'button',
			classes: [styles.actionButton, styles.actionPrimary],
			textContent: mode === 'discard' ? 'Discard' : 'Confirm',
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
			children: [cancelButton, confirmButton],
		})

		const sheet = element('div', {
			classes: styles.sheet,
			children: [titleEl, actionsRow],
		})

		const backdrop = element('div', {
			classes: styles.backdrop,
			on: {
				click() {
					closeOverlay()
					onCancel()
				},
			},
		})

		const layer = element('section', {
			classes: styles.layer,
			aria: { labelledBy: titleId },
			role: 'dialog',
			children: [backdrop, fieldset, sheet],
		})
		layer.hidden = true

		let activeRadios: HTMLInputElement[] = []
		let activeLabels: HTMLLabelElement[] = []
		let resizeObserver: ResizeObserver | undefined
		let injectedPreviews: Map<ScoreField, HTMLSpanElement> = new Map()

		function scoreCardEl(): HTMLElement | null {
			return document.getElementById(SCORE_CARD_ID)
		}

		function rowEl(field: ScoreField): HTMLElement | null {
			const card = scoreCardEl()
			if (!card) return null
			return card.querySelector<HTMLElement>(`[data-field="${field}"]`)
		}

		function scoreCellEl(field: ScoreField): HTMLElement | null {
			const row = rowEl(field)
			if (!row) return null
			return row.querySelector<HTMLElement>('[data-cell="score"]')
		}

		function selectedField(): ScoreField | undefined {
			const checked = activeRadios.find(r => r.checked)
			return checked?.value as ScoreField | undefined
		}

		function syncConfirm() {
			confirmButton.disabled = selectedField() === undefined
		}

		function decorateRows(fields: RowOverlayField[]) {
			const card = scoreCardEl()
			if (card) card.dataset.selecting = mode
			fields.forEach(({ field, variant }) => {
				const row = rowEl(field)
				if (!row) return
				row.dataset.target = variant === 'valid' ? 'valid' : 'discard'
			})
		}

		function undecorateRows() {
			const card = scoreCardEl()
			if (card) delete card.dataset.selecting
			card?.querySelectorAll<HTMLElement>('[data-field]').forEach((row) => {
				delete row.dataset.target
				delete row.dataset.hover
			})
			injectedPreviews.forEach((node, field) => {
				const cell = scoreCellEl(field)
				if (cell && cell.contains(node)) node.remove()
			})
			injectedPreviews.clear()
		}

		function setHover(field: ScoreField, on: boolean) {
			const row = rowEl(field)
			if (!row) return
			if (on) row.dataset.hover = 'true'
			else delete row.dataset.hover
		}

		function showPreview(field: ScoreField, text: string, variant: 'valid' | 'discard') {
			const cell = scoreCellEl(field)
			if (!cell) return
			hidePreview(field)
			// Hide any existing content in the cell (the current score value)
			// so the preview replaces it rather than sitting next to it.
			Array.from(cell.children).forEach((child) => {
				if (child instanceof HTMLElement) child.dataset.overlayHidden = 'true'
			})
			const node = document.createElement('span')
			node.className = variant === 'valid' ? styles.scorePreview! : styles.scorePreviewDiscard!
			node.textContent = text
			cell.append(node)
			injectedPreviews.set(field, node)
		}

		function hidePreview(field: ScoreField) {
			const existing = injectedPreviews.get(field)
			if (existing) {
				existing.remove()
				injectedPreviews.delete(field)
			}
			const cell = scoreCellEl(field)
			if (cell) {
				cell.querySelectorAll<HTMLElement>('[data-overlay-hidden="true"]').forEach((child) => {
					delete child.dataset.overlayHidden
				})
			}
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
			fields.forEach(({ field, variant, preview }, index) => {
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
							setHover(field, true)
							if (preview !== undefined) showPreview(field, preview, variant)
						},
						blur() {
							setHover(field, false)
							hidePreview(field)
						},
					},
				})
				const label = element('label', {
					htmlFor: radioId(field),
					classes: [
						styles.option,
						variant === 'valid' ? styles.optionValid : styles.optionDiscard,
					],
					aria: { label: `${rowDisplayLabels[field].title} — ${variant === 'valid' ? 'apply' : 'discard'}` },
					children: [radio],
					on: {
						mouseenter() {
							setHover(field, true)
							if (preview !== undefined) showPreview(field, preview, variant)
						},
						mouseleave() {
							setHover(field, false)
							hidePreview(field)
						},
					},
				})
				label.dataset.field = field
				if (index === 0) label.dataset.firstOption = 'true'
				activeRadios.push(radio)
				activeLabels.push(label)
				fieldset.append(label)
			})
			decorateRows(fields)
		}

		function repositionLabels() {
			activeLabels.forEach((label) => {
				const field = label.dataset.field as ScoreField | undefined
				if (!field) return
				const row = rowEl(field)
				if (!row) {
					label.style.display = 'none'
					return
				}
				const rect = row.getBoundingClientRect()
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
			undecorateRows()
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
