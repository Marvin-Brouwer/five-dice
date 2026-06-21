import { component } from '@rooted/components'

import type { DieValue } from '../../game/_logic/gameConstants.ts'

import styles from './die.css'

export type NumberDieOptions = {
	value: DieValue
	ariaLabel?: string
}

export const NumberDie = component<NumberDieOptions>({
	name: 'number-die',
	styles,
	onMount({ append, element, options }) {
		append(element('span', {
			classes: styles.die,
			role: 'img',
			aria: { label: options.ariaLabel ?? `Die showing ${options.value}` },
			textContent: String(options.value),
		}))
	},
})
