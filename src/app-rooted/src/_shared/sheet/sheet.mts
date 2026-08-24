import { component, cssClass, type CssClass } from '@rooted/components'

import type { RenderContext } from '../render-context.ts'

import styles from './sheet.css'

export type SheetVariant = 'keypad' | 'picker'

export type SheetOptions = {
	/**
	 * `dialog` gives the top layer, a focus trap and Escape for free.
	 * `div` is for callers that own their own layering — the row picker
	 * cannot use a native dialog, because its hit targets sit over the score
	 * card and it must not trap focus.
	 */
	as: 'dialog' | 'div'
	variant: SheetVariant
	title: string
	titleId: string
	/** The picker shows its title; the keypad's is for screen readers only. */
	titleVisible?: boolean
	/** Grab handle above the content. The picker has none. */
	handle?: boolean
	content: Array<Node>
	actions: Array<Node>
	/** CSS grid columns for the action row. Defaults to two buttons. */
	actionColumns?: string
	/** Handed the sheet element once, at mount. */
	ref?: (element: HTMLElement) => void
}

/**
 * The bottom-sheet chrome shared by the dice keypad and the row picker:
 * handle, hidden title, content and the action bar.
 *
 * Chrome only — deliberately not modality. The two dialogs layer in
 * incompatible ways and each keeps its own strategy.
 */
export const Sheet = component<SheetOptions>({
	name: 'sheet-chrome',
	styles,
	onMount({ replace, element, options }) {
		const { as, variant, title, titleId, titleVisible, handle, content, actions, actionColumns, ref } = options

		const children: Array<Node> = []
		if (handle) {
			children.push(element('span', { classes: styles.handle, aria: { hidden: 'true' } }))
		}
		children.push(element('h2', {
			id: titleId,
			classes: titleVisible ? styles.sheetTitle : styles.visuallyHidden,
			textContent: title,
		}))
		children.push(...content)
		children.push(element('div', {
			classes: styles.actionsRow,
			style: { gridTemplateColumns: actionColumns ?? '1fr 1.5fr' },
			children: actions,
		}))

		const classes = [styles.sheet, variantClass(variant)]
		const sheet = as === 'dialog'
			? element('dialog', { classes, aria: { modal: 'true', labelledBy: titleId }, children })
			: element('div', { classes, children })

		ref?.(sheet)
		replace(sheet)
	},
})

function variantClass(variant: SheetVariant): CssClass {
	return variant === 'keypad' ? styles.sheetKeypad : styles.sheetPicker
}

export type SheetButtonOptions = {
	variant: 'primary' | 'secondary'
	label?: string
	ariaLabel?: string
	children?: Array<Node>
	disabled?: boolean
	onClick: () => void
}

/**
 * A sheet action button. A render function rather than a component so the
 * caller keeps a direct reference — the labels and disabled states change as
 * the dialog is used.
 */
export function sheetButton(context: RenderContext, options: SheetButtonOptions): HTMLButtonElement {
	const { variant, label, ariaLabel, children, disabled, onClick } = options

	return context.element('button', {
		type: 'button',
		classes: [
			styles.actionButton,
			cssClass(variant === 'primary', styles.actionPrimary),
			cssClass(variant === 'secondary', styles.actionSecondary),
		],
		...(ariaLabel === undefined ? {} : { aria: { label: ariaLabel } }),
		...(label === undefined ? {} : { textContent: label }),
		...(children === undefined ? {} : { children }),
		...(disabled === undefined ? {} : { disabled }),
		on: { click: onClick },
	})
}
