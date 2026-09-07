import { component, optional } from '@rooted/components'
import type { Store } from '@rooted/store'

import styles from './menu-row.css'

export type MenuRowVariant = 'display' | 'button' | 'link' | 'external-link'

export type MenuRowOptions = {
	label: string
	hint?: string
	variant?: MenuRowVariant
	href?: string | { toString(): string }
	disabled?: boolean
	/** Optional store driving the disabled state reactively. Overrides `disabled`. */
	disabledStore?: Store<boolean>
	onSelect?: () => void
	control: Node
}

/** One row inside the menu: label + optional hint on the left, control slot on the right.
    Renders as a button, link, external link, or plain div depending on `variant`. */
export const MenuRow = component<MenuRowOptions>({
	name: 'menu-row',
	styles,
	onMount({ append, element, signal, options }) {
		const { label, hint, variant = 'display', href, disabled = false, disabledStore, onSelect, control } = options
		const initialDisabled = disabledStore?.value ?? disabled

		const labelBlock = element('span', {
			classes: styles.labels,
			children: [
				element('span', {
					classes: styles.title,
					textContent: label,
				}),
				optional(Boolean(hint),
					element('span', {
						classes: styles.hint,
						textContent: hint,
					})
				),
			],
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
			const button = element('button', {
				type: 'button',
				classes: [styles.row, styles.rowButton],
				disabled: initialDisabled,
				on: {
					click() {
						if (!button.disabled) onSelect?.()
					},
				},
				children: [labelBlock, controlWrap],
			})
			if (disabledStore) {
				disabledStore.on('change', signal, ({ detail }) => {
					button.disabled = detail.state
				})
			}
			append(button)
			return
		}
		append(element('div', {
			classes: styles.row,
			children: [labelBlock, controlWrap],
		}))
	},
})
