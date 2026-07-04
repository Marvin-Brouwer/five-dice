import { component } from '@rooted/components'

import styles from './menu-row.css'

export type MenuRowVariant = 'display' | 'button' | 'link' | 'external-link'

export type MenuRowOptions = {
	label: string
	hint?: string
	variant?: MenuRowVariant
	href?: string | { toString(): string }
	disabled?: boolean
	onSelect?: () => void
	control: Node
}

/** One row inside the menu: label + optional hint on the left, control slot on the right.
    Renders as a button, link, external link, or plain div depending on `variant`. */
export const MenuRow = component<MenuRowOptions>({
	name: 'menu-row',
	styles,
	onMount({ append, element, options }) {
		const { label, hint, variant = 'display', href, disabled = false, onSelect, control } = options

		const labelBlock = element('span', {
			classes: styles.labels,
			children: [
				element('span', { classes: styles.title, textContent: label }),
				hint ? element('span', { classes: styles.hint, textContent: hint }) : undefined!,
			].filter(Boolean),
		})

		const controlWrap = element('span', {
			classes: styles.control,
			children: control,
		})

		if (variant === 'link' && href) {
			append(element('a', {
				classes: styles.row,
				href: String(href),
				children: [labelBlock, controlWrap],
			}))
			return
		}
		if (variant === 'external-link' && href) {
			append(element('a', {
				classes: styles.row,
				href: String(href),
				target: '_blank',
				rel: 'noopener noreferrer',
				children: [labelBlock, controlWrap],
			}))
			return
		}
		if (variant === 'button') {
			append(element('button', {
				type: 'button',
				classes: [styles.row, styles.rowButton],
				disabled,
				on: {
					click() {
						if (!disabled) onSelect?.()
					},
				},
				children: [labelBlock, controlWrap],
			}))
			return
		}
		append(element('div', {
			classes: styles.row,
			children: [labelBlock, controlWrap],
		}))
	},
})
