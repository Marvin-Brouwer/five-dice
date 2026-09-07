import { component } from '@rooted/components'

import { localization } from '../../_shared/i18n/localization.mts'
import { PipDie } from '../../_shared/die/pip-die.mts'

import { dieValues, type DiceStore } from './dice-state.mts'
import styles from './dice-keypad.css'

export type DiceKeypadOptions = {
	state: DiceStore
}

/** The six number keys. Every key is a plain command on the dice store. */
export const DiceKeypad = component<DiceKeypadOptions>({
	name: 'dice-keypad',
	styles,
	onMount({ replace, element, create, options }) {
		const { state } = options

		const buttons = dieValues.map(value => element('button', {
			type: 'button',
			classes: styles.keypadButton,
			aria: { label: localization.text`Add a ${value}` },
			children: element('span', {
				classes: styles.keyDie,
				children: create(PipDie, {
					value,
					ariaLabel: localization.text`Add a ${value}`,
				}),
			}),
			on: {
				click() {
					state.fill(value)
				},
			},
		}))

		replace(element('div', {
			role: 'group',
			aria: { label: localization.text`Dice keys` },
			classes: styles.keysRow,
			children: buttons,
		}))
	},
})
