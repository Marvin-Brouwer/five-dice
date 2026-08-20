import { component, cssClass, type ComponentContext } from '@rooted/components'
import { type Store } from '@rooted/store'

import { type ScoreField } from '../_logic/gameConstants.ts'
import type { RenderContext } from '../../_shared/render-context.ts'
import { localization } from '../../_shared/i18n/localization.mts'
import { getRowDisplayLabels } from '../score-card/score-card.labels.ts'

import styles from './row-overlay.css'

export type RowOverlayField = {
	field: ScoreField
	variant: 'valid' | 'discard'
	preview?: string
	/** Renderer producing a Node for the roll-cell preview. When set, the
	    hovered row's roll cell is replaced with this node; when omitted, the
	    roll cell is left untouched (used by the flush-discard overlay). */
	projectedRoll?: (context: RenderContext) => Node
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

// TODO, not using rooted correctly
export const RowOverlay = component<RowOverlayOptions>({
	name: 'row-overlay',
	styles,
	onMount({ append, element, create, signal, options, on }) {
		const { open, mode, title, availableFields, onConfirm, onCancel } = options
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
		const injectedScoreSpans: Map<ScoreField, HTMLSpanElement> = new Map()
		const injectedRollNodes: Map<ScoreField, Node> = new Map()

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

		function rollCellEl(field: ScoreField): HTMLElement | null {
			const row = rowEl(field)
			if (!row) return null
			return row.querySelector<HTMLElement>('td.roll-column')
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
			// Fully unwind every injected preview so no stale nodes or hidden
			// originals survive into whatever DOM the score-card renders next.
			for (const field of Array.from(injectedScoreSpans.keys())) hidePreview(field)
			// Safety net: sweep the whole card for any straggling overlay
			// markers or preview nodes in case a preview was orphaned by a
			// rerender that raced with our cleanup.
			card?.querySelectorAll<HTMLElement>('[data-overlay-hidden="true"]').forEach((child) => {
				delete child.dataset.overlayHidden
			})
			card?.querySelectorAll<HTMLElement>('[data-score-preview]').forEach((n) => n.remove())
			card?.querySelectorAll<HTMLElement>('[data-roll-preview]').forEach((n) => n.remove())
		}

		function setHover(field: ScoreField, on: boolean) {
			const row = rowEl(field)
			if (!row) return
			if (on) row.dataset.hover = 'true'
			else delete row.dataset.hover
		}

		function showPreview(field: ScoreField, text: string, variant: 'valid' | 'discard', projectedRoll?: (context: RenderContext) => Node) {
			const scoreCell = scoreCellEl(field)
			if (!scoreCell) return
			hidePreview(field)
			// Hide the cell's current content so the preview replaces it
			// visually rather than sitting alongside the real score.
			Array.from(scoreCell.children).forEach((child) => {
				if (child instanceof HTMLElement) child.dataset.overlayHidden = 'true'
			})
			const scoreNode = document.createElement('span')
			// A data attribute (not a scoped class) so score-card.css can
			// style the injected preview from its own CSS scope.
			scoreNode.dataset.scorePreview = variant
			scoreNode.textContent = text
			scoreCell.append(scoreNode)
			injectedScoreSpans.set(field, scoreNode)

			// Roll cell: the caller supplies a projected renderer that already
			// knows how to draw the post-apply state (including flush badges).
			if (projectedRoll) {
				const rollCell = rollCellEl(field)
				if (rollCell) {
					Array.from(rollCell.children).forEach((child) => {
						if (child instanceof HTMLElement) child.dataset.overlayHidden = 'true'
					})
					const rollNode = projectedRoll({ element, create })
					if (rollNode instanceof HTMLElement) rollNode.dataset.rollPreview = 'true'
					rollCell.append(rollNode)
					injectedRollNodes.set(field, rollNode)
				}
			}
		}

		function hidePreview(field: ScoreField) {
			const scoreNode = injectedScoreSpans.get(field)
			if (scoreNode) {
				scoreNode.remove()
				injectedScoreSpans.delete(field)
			}
			const rollNode = injectedRollNodes.get(field)
			if (rollNode) {
				rollNode.parentNode?.removeChild(rollNode)
				injectedRollNodes.delete(field)
			}
			for (const cell of [scoreCellEl(field), rollCellEl(field)]) {
				cell?.querySelectorAll<HTMLElement>('[data-overlay-hidden="true"]').forEach((child) => {
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
			fields.forEach(({ field, variant, preview, projectedRoll }, index) => {
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
							if (preview !== undefined) showPreview(field, preview, variant, projectedRoll)
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
						cssClass(styles.optionValid, variant === 'valid'),
						cssClass(styles.optionDiscard, variant !== 'valid'),
					],
					aria: {
						label: localization.text`${getRowDisplayLabels()[field].title}, ${variant === 'valid' ? localization.text`apply` : localization.text`discard`}`
					},
					children: radio,
					on: {
						mouseenter() {
							setHover(field, true)
							if (preview !== undefined) showPreview(field, preview, variant, projectedRoll)
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
