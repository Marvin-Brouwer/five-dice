import { component } from '@rooted/components'

import type { InputFlowStore } from '../_logic/input-flow-store.mts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { StickerButton } from '../../_shared/sticker/sticker-button.mts'
import { menuStore } from '../../_shared/stores/menuStore.mts'

import styles from './enter-score-sticker.css'

export type EnterScoreStickerOptions = {
	store: ScorePadStore
	flow: InputFlowStore
}

/**
 * The "Enter score" sticker on the card's corner.
 *
 * The sticker itself is shared with the guide page, which shows one to explain
 * it; this owns where it hangs and when it is available. Hidden once the game
 * ends, and made inert (but still visible) while an overlay or the menu owns
 * the screen.
 */
export const EnterScoreSticker = component<EnterScoreStickerOptions>({
	name: 'enter-score-sticker',
	styles,
	onMount({ append, create, signal, options }) {
		const { store, flow } = options

		let sticker: HTMLButtonElement | undefined

		function sync() {
			if (sticker === undefined) return
			const ended = store.gameEnded()
			const blocked = flow.isActive() || menuStore.value
			sticker.hidden = ended
			sticker.disabled = ended
			sticker.classList.toggle(styles.stickerInert!, blocked)
			sticker.setAttribute('aria-hidden', blocked ? 'true' : 'false')
			sticker.tabIndex = blocked ? -1 : 0
		}

		append(
			create(StickerButton, {
				label: localization.text`Enter\nscore`,
				ariaLabel: localization.text`Enter score`,
				classes: styles.stickerPlacement,
				on: {
					click() {
						if (store.gameEnded()) return
						flow.open()
					},
				},
				// Mounts a microtask after this one, so the first sync has to wait
				// for the button rather than run at the bottom of this function.
				reference(button) {
					sticker = button
					sync()
				},
			})
		)

		store.on('change', signal, sync)
		flow.on('change', signal, sync)
		menuStore.on('change', signal, sync)
	},
})
