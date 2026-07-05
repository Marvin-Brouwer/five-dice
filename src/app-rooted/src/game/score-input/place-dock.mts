import { component } from '@rooted/components'
import { type Store } from '@rooted/store'

import type { ScorePadStore } from '../_logic/scorePadStore.mts'

import { inputActiveStore } from './input-active-store.mts'
import styles from './place-dock.css'

export type PlaceDockOptions = {
	store: ScorePadStore
	openRequest: Store<boolean>
}

export const PlaceDock = component<PlaceDockOptions>({
	name: 'place-dock',
	styles,
	onMount({ append, element, signal, options }) {
		const { store, openRequest } = options

		const button = element('button', {
			type: 'button',
			classes: styles.placeButton,
			textContent: store.gameEnded() ? 'Game over' : 'Enter score',
			disabled: store.gameEnded(),
			aria: { label: store.gameEnded() ? 'Game over' : 'Enter score' },
			on: {
				click() {
					if (store.gameEnded()) return
					openRequest.update(() => true)
				},
			},
		})

		const dock = element('div', {
			classes: styles.dock,
			role: 'toolbar',
			aria: { label: 'Score entry' },
			children: [button],
		})

		function syncGame() {
			const ended = store.gameEnded()
			button.disabled = ended
			button.textContent = ended ? 'Game over' : 'Enter score'
			button.setAttribute('aria-label', ended ? 'Game over' : 'Enter score')
		}

		function syncActive() {
			dock.hidden = inputActiveStore.value
		}

		store.on('change', signal, syncGame)
		inputActiveStore.on('change', signal, syncActive)
		syncGame()
		syncActive()

		append(dock)
	},
})
