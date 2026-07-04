import { component } from '@rooted/components'

import styles from './menu-section.css'

export type MenuSectionOptions = {
	label: string
	rightHint?: string
}

/** A section separator inside the menu: dashed top/bottom rules, mono uppercase
    label on the left with an optional right-aligned mono hint. */
export const MenuSection = component<MenuSectionOptions>({
	name: 'menu-section',
	styles,
	onMount({ append, element, options }) {
		const { label, rightHint } = options
		append(
			element('div', {
				classes: styles.section,
				children: [
					element('span', {
						classes: styles.label,
						textContent: label,
					}),
					rightHint
						? element('span', {
							classes: styles.hint,
							textContent: rightHint,
						})
						: undefined!,
				].filter(Boolean),
			}),
		)
	},
})
