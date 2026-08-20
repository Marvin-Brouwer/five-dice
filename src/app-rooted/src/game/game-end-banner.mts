import { component } from '@rooted/components'
import JSConfetti from 'js-confetti'

import type { ScorePadStore } from './_logic/scorePadStore.mts'
import { localization } from '../_shared/i18n/localization.mts'

import { createAudioPlayer } from './audio/audio.ts'
import styles from './game-end-banner.css'

export type GameEndBannerOptions = {
	store: ScorePadStore
}

/**
 * The end-of-game notice, plus the celebration that goes with it.
 *
 * Creating the audio player eagerly matters: it registers the document
 * gesture listeners that unlock playback, which have to be in place well
 * before the game actually ends.
 */
export const GameEndBanner = component<GameEndBannerOptions>({
	name: 'game-end-banner',
	styles,
	async onMount({ replace, element, signal, options, on }) {
		const { store } = options

		const banner = element('aside', {
			classes: [styles.endBanner, styles.hidden],
			role: 'status',
			aria: { live: 'polite' },
			textContent: localization.text`Game finished. Review your score below.`,
		})
		replace(banner)

		const audioPlayer = await createAudioPlayer(on)
		const confetti = typeof window !== 'undefined' ? new JSConfetti() : undefined

		// The pad store outlives this component (see scorePadStore.mts), so a
		// remount -- a language switch, say -- can observe a game that was
		// already finished. Start primed so that doesn't replay the
		// celebration, which belongs to the actual finishing move.
		let celebrated = store.gameEnded()

		function sync() {
			const ended = store.gameEnded()
			banner.classList.toggle(styles.hidden!, !ended)
			if (!ended) {
				celebrated = false
				return
			}
			if (celebrated) return
			celebrated = true
			confetti?.addConfetti()
			void audioPlayer.playGameEndFanfare()
		}

		sync()
		store.on('change', signal, sync)
	},
})
