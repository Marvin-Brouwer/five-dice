import { component } from '@rooted/components'
import { type Store } from '@rooted/store'

import { type ScoreField } from '../_logic/gameConstants.ts'
import { rowDisplayLabels } from '../score-card/score-card.labels.ts'

import styles from './row-overlay.css'

export type RowOverlayField = {
	field: ScoreField
	variant: 'valid' | 'discard'
}

export type RowOverlayOptions = {
	open: Store<boolean>
	title: string
	availableFields: () => RowOverlayField[]
	onConfirm: (field: ScoreField) => void
	onCancel: () => void
}

export const RowOverlay = component<RowOverlayOptions>({
	name: 'row-overlay',
	styles,
	onMount({ append, element, signal, options, on }) {
		const { open, title, availableFields, onConfirm, onCancel } = options
		const titleId = `row-overlay-title-${Math.random().toString(36).slice(2, 8)}`

		const fieldset = element('fieldset', {
			classes: styles.fieldset,
			aria: { labelledBy: titleId },
		})
		const titleEl = element('h2', {
			id: titleId,
			classes: styles.title,
			textContent: title,
		})

		const cancelButton = element('button', {
			type: 'button',
			classes: styles.cancelButton,
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
			classes: styles.confirmButton,
			textContent: 'Confirm',
			disabled: true,
			on: {
				click() {
					const selected = selectedField()
					if (selected === undefined) return
					closeOverlay()
					onConfirm(selected)
				},
			},
		})

		const footer = element('div', {
			classes: styles.footer,
			children: [cancelButton, confirmButton],
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
			children: [backdrop, titleEl, fieldset, footer],
		})
		layer.hidden = true

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
			fields.forEach(({ field, variant }, index) => {
				const radio = element('input', {
					type: 'radio',
					name: 'row-overlay-selection',
					value: field,
					classes: styles.radio,
					id: `row-overlay-radio-${field}`,
					on: {
						change: syncConfirm,
					},
				})
				const label = element('label', {
					htmlFor: `row-overlay-radio-${field}`,
					classes: [
						styles.option,
						variant === 'valid' ? styles.optionValid : styles.optionDiscard,
					],
					children: [
						radio,
						element('span', {
							classes: styles.optionTitle,
							textContent: rowDisplayLabels[field].title,
						}),
						element('span', {
							classes: styles.optionMeta,
							textContent: variant === 'valid' ? 'apply' : 'discard',
						}),
					],
				})
				label.dataset.field = field
				if (index === 0) label.dataset.firstOption = 'true'
				activeRadios.push(radio)
				activeLabels.push(label)
				fieldset.append(label)
			})
		}

		function repositionLabels() {
			activeLabels.forEach((label) => {
				const field = label.dataset.field
				if (!field) return
				const row = document.querySelector(`[data-field="${field}"]`) as HTMLElement | null
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
