import { component } from '@rooted/components'

import { localization } from '../../_shared/i18n/localization.mts'
import { playerNameStore } from '../../_shared/stores/playerNameStore.mts'

import styles from './player-name-field.css'

const INPUT_ID = 'player-name'

/**
 * The player's name, persisted through `playerNameStore` (localStorage-backed).
 *
 * Owns its own input rather than taking a store option, because the store is a
 * module-level singleton the whole app already shares.
 */
export const PlayerNameField = component({
	name: 'player-name-field',
	styles,
	onMount({ replace, element }) {
		const nameInput = element('input', {
			type: 'text',
			id: INPUT_ID,
			classes: styles.nameInput,
			placeholder: localization.text`Your name here`,
			value: playerNameStore.value,
			on: {
				input(event) {
					playerNameStore.update(() => event.currentTarget.value)
					syncClearButton()
				},
			},
		})

		const clearNameButton = element('button', {
			type: 'button',
			classes: styles.nameClearButton,
			textContent: '×',
			aria: { label: localization.text`Clear name` },
			hidden: playerNameStore.value.length === 0,
			on: {
				click() {
					playerNameStore.update(() => '')
					nameInput.value = ''
					nameInput.focus()
					syncClearButton()
				},
			},
		})

		function syncClearButton() {
			clearNameButton.hidden = nameInput.value.length === 0
		}

		replace(element('span', {
			classes: styles.nameField,
			children: [
				element('label', {
					classes: styles.nameLabel,
					htmlFor: INPUT_ID,
					textContent: localization.text`Player`,
				}),
				element('span', {
					classes: styles.nameInputWrap,
					children: [nameInput, clearNameButton],
				}),
			],
		}))
	},
})
