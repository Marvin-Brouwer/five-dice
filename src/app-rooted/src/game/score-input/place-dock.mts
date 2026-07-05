import { component } from '@rooted/components'
import { type Store } from '@rooted/store'

import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { PipDie } from '../../_shared/die/pip-die.mts'

import styles from './place-dock.css'

export type PlaceDockOptions = {
	store: ScorePadStore
	openRequest: Store<boolean>
}

const SLOT_COUNT = 5
const SLOT_SIZE = 24

export const PlaceDock = component<PlaceDockOptions>({
	name: 'place-dock',
	styles,
	onMount({ append, element, create, signal, options }) {
		const { store, openRequest } = options

		const slots = Array.from({ length: SLOT_COUNT }, () => {
			const wrap = element('span', { classes: styles.slot })
			wrap.append(create(PipDie, { value: undefined, size: SLOT_SIZE, variant: 'muted', ariaLabel: 'Empty slot' }))
			return wrap
		})

		const slotsRow = element('span', {
			classes: styles.slots,
			aria: { hidden: 'true' },
			children: slots,
		})

		const button = element('button', {
			type: 'button',
			classes: styles.placeButton,
			textContent: store.gameEnded() ? 'Game over' : 'Place',
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
			children: [slotsRow, button],
		})

		function sync() {
			const ended = store.gameEnded()
			button.disabled = ended
			button.textContent = ended ? 'Game over' : 'Place'
			button.setAttribute('aria-label', ended ? 'Game over' : 'Enter score')
		}

		store.on('change', signal, sync)
		sync()

		append(dock)
	},
})
