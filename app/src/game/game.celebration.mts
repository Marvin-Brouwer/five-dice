import type { ComponentContext } from '@rooted/components'
import JSConfetti from 'js-confetti'

import type { ScorePadStore } from './logic/scorePadStore.mts'

import { createAudioPlayer } from './audio/audio.ts'

type CelebrationContext = Pick<ComponentContext, 'signal' | 'on'> & { store: ScorePadStore }

/**
 * Confetti and the fanfare, fired once on the move that ends the game.
 *
 * A plain function rather than a component, because the celebration has no
 * markup of its own: the finished board announces itself through the score
 * card's round label, and nothing is added below the card.
 */
export function wireGameCelebration({ signal, on, store }: CelebrationContext) {

	// Eager on purpose: creating the player is what registers the document
	// gesture listeners that unlock playback, and those have to be in place
	// long before the game ends. Nothing is awaited -- the call returns before
	// its first await -- so the caller stays synchronous.
	const audioPlayer = createAudioPlayer(on)
	const confetti = typeof window !== 'undefined' ? new JSConfetti() : undefined

	// The pad store outlives this page (see scorePadStore.mts), so a remount
	// -- a language switch, say -- can observe a game that was already over.
	// Start primed so that doesn't replay the celebration, which belongs to
	// the actual finishing move.
	let celebrated = store.gameEnded()

	function sync() {
		if (!store.gameEnded()) {
			celebrated = false
			return
		}
		if (celebrated) return
		celebrated = true
		confetti?.addConfetti()
		void audioPlayer.then(player => player.playGameEndFanfare())
	}

	sync()
	store.on('change', signal, sync)
}
