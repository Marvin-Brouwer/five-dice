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
			// There is nothing to submit -- the name is saved on every
			// keystroke -- so the phone keyboard's action key says Done and
			// closes the keyboard rather than promising a submit that is not
			// coming.
			enterKeyHint: 'done',
			on: {
				input(event) {
					playerNameStore.update(() => event.currentTarget.value)
					syncClearButton()
				},
				keydown(event) {
					// A bare input has no implicit submission, so Enter would
					// otherwise do nothing at all and leave the keyboard up over
					// the card. Modifier chords and IME composition are left
					// alone: mid-composition Enter is picking a candidate.
					if (event.key !== 'Enter' || event.isComposing) return
					if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
					event.preventDefault()
					event.currentTarget.blur()
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
