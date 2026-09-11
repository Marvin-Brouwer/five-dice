import { cssClass } from '@rooted/components'
import type { Aria, ElementChildren } from '@rooted/elements'

import type { RenderContext } from '../render-context.ts'

import styles from './sheet.css'

export type SheetButtonOptions = {
	variant: 'primary' | 'secondary'
	label?: string
	aria?: Pick<Aria, 'label'>
	children?: ElementChildren
	disabled?: boolean
	onClick: () => void
}

/**
 * A sheet action button. A render function rather than a component so the
 * caller keeps a direct reference — the labels and disabled states change as
 * the dialog is used.
 *
 * The styles come from `sheet.css` rather than a stylesheet of its own:
 * `.sheet-keypad .action-button` sizes the button from the sheet variant
 * around it, so the rule has to sit where both class names are owned.
 */
export function sheetButton(context: RenderContext, options: SheetButtonOptions): HTMLButtonElement {
	const { variant, label, aria, children, disabled, onClick } = options

	return context.element('button', {
		type: 'button',
		classes: [
			styles.actionButton,
			cssClass(variant === 'primary', styles.actionPrimary),
			cssClass(variant === 'secondary', styles.actionSecondary),
		],
		aria,
		textContent: label,
		children,
		disabled,
		on: {
			click: onClick,
		},
	})
}
