import { component, cssClass, optional, type CssClass } from '@rooted/components'
import type { ElementChild, ElementChildren } from '@rooted/elements'

import styles from './sheet.css'

export type SheetVariant = 'keypad' | 'picker'

export type SheetOptions = {
	/**
	 * `dialog` gives the top layer, a focus trap and Escape for free. The
	 * keypad takes it here, because its sheet *is* the whole dialog.
	 *
	 * `div` is for callers whose sheet is a child of a dialog they own
	 * further out. The row picker is one: its dialog is the full-viewport
	 * layer holding both this sheet and the per-row hit targets, so nesting a
	 * second dialog in here would be modality twice over.
	 */
	as: 'dialog' | 'div'
	variant: SheetVariant
	title: string
	titleId: string
	/** The picker shows its title; the keypad's is for screen readers only. */
	titleVisible?: boolean
	/** Grab handle above the content. The picker has none. */
	handle?: boolean
	content: ElementChildren
	actions: Array<Node>
	/** CSS grid columns for the action row. Defaults to two buttons. */
	actionColumns?: string
	/** Handed the sheet element once, at mount. */
	reference?: (element: HTMLElement) => void
}

/**
 * The bottom-sheet chrome shared by the dice keypad and the row picker:
 * handle, hidden title, content and the action bar.
 *
 * Chrome only — deliberately not modality. Each caller decides where the
 * dialog boundary sits: around the sheet itself, or further out around the
 * sheet and whatever else the overlay puts on screen with it.
 */
export const Sheet = component<SheetOptions>({
	name: 'sheet-chrome',
	styles,
	onMount({ replace, element, options }) {
		const { as, variant, title, titleId, titleVisible, handle, content, actions, actionColumns, reference } = options

		const children: Array<ElementChild> = [
			optional(handle,
				element('span', {
					classes: styles.handle,
					aria: {
						hidden: 'true',
					},
				})
			),
			element('h2', {
				id: titleId,
				classes: [
					styles.sheetTitle,
					cssClass(!titleVisible, styles.visuallyHidden),
				],
				textContent: title,
			}),
			...(Array.isArray(content) ? content : [content]),
			element('div', {
				classes: styles.actionsRow,
				style: {
					gridTemplateColumns: actionColumns,
				},
				children: actions,
			}),
		]

		const classes = [
			styles.sheet,
			variantClass(variant),
		]
		const sheet = as === 'dialog'
			? element('dialog', {
				classes,
				aria: {
					modal: 'true',
					labelledBy: titleId,
				},
				children,
			})
			: element('div', {
				classes,
				children,
			})

		reference?.(sheet)
		replace(sheet)
	},
})

function variantClass(variant: SheetVariant): CssClass {
	return variant === 'keypad' ? styles.sheetKeypad : styles.sheetPicker
}
