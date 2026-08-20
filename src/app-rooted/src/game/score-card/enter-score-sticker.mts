import { component } from '@rooted/components'

import type { InputFlowStore } from '../_logic/input-flow-store.mts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { menuStore } from '../../_shared/stores/menuStore.mts'

import styles from './enter-score-sticker.css'

export type EnterScoreStickerOptions = {
	store: ScorePadStore
	flow: InputFlowStore
}

/**
 * The "Enter score" sticker on the card's corner.
 *
 * Hidden once the game ends, and made inert (but still visible) while an
 * overlay or the menu owns the screen.
 */
export const EnterScoreSticker = component<EnterScoreStickerOptions>({
	name: 'enter-score-sticker',
	styles,
	onMount({ replace, element, signal, options }) {
		const { store, flow } = options

		const sticker = element('button', {
			type: 'button',
			classes: styles.sticker,
			aria: { label: localization.text`Enter score` },
			on: {
				click() {
					if (store.gameEnded()) return
					flow.open()
				},
			},
			children: [
				element('span', {
					classes: styles.stickerLabel,
					textContent: localization.text`Enter\nscore`,
				}),
			],
		})

		function sync() {
			const ended = store.gameEnded()
			const blocked = flow.isActive() || menuStore.value
			sticker.hidden = ended
			sticker.disabled = ended
			sticker.classList.toggle(styles.stickerInert!, blocked)
			sticker.setAttribute('aria-hidden', blocked ? 'true' : 'false')
			sticker.tabIndex = blocked ? -1 : 0
		}

		sync()
		store.on('change', signal, sync)
		flow.on('change', signal, sync)
		menuStore.on('change', signal, sync)
		replace(sticker)
	},
})
