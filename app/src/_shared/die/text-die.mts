import { component } from '@rooted/components'

import styles from './die.css'

export type TextDieOptions = {
	text: string
	ariaLabel?: string
}

export const TextDie = component<TextDieOptions>({
	name: 'text-die',
	styles,
	onMount({ append, element, options }) {
		append(element('span', {
			classes: [styles.die, styles.dieText],
			role: 'img',
			aria: { label: options.ariaLabel ?? options.text },
			textContent: options.text,
		}))
	},
})
