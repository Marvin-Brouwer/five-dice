import { component } from '@rooted/components'
import { createStore } from '@rooted/store'
import JSConfetti from 'js-confetti'

import { newGameDisabledStore, undoDisabledStore } from '../_shared/stores/gameStateStore.mts'
import { localization } from '../_shared/i18n/localization.mts'
import { createAudioPlayer } from './audio/audio.ts'
import { ScoreCard } from './score-card/score-card.mts'
import { ScoreInput } from './score-input/score-input.mts'
import { createGameContext } from './_logic/game-context.mts'

import styles from './game.css'

export const Game = component({
	name: 'game-page',
	styles,
	async onMount({ append, element, create, signal, on }) {

		const game = createGameContext()
		const store = game.pad

		const openRequest = createStore(false)

		on('window', 'beforeunload', (event) => {
			if (!store.hasProgress()) return
			event.preventDefault()
			const message = localization.text`You have a scorepad with changes, are you sure you want to reload the page?`
			event.returnValue = message
		})

		const audioPlayer = await createAudioPlayer(on)

		const endBanner = element('aside', {
			classes: [
				styles.endBanner,
				styles.hidden
			],
			role: 'status',
			aria: {
				live: 'polite'
			},
			textContent: localization.text`Game finished. Review your score below.`,
		})

		const confetti = typeof window !== 'undefined' ? new JSConfetti() : undefined
		// The store now outlives this component (see scorePadStore.mts), so a
		// remount (e.g. a language switch) can observe a game that was already
		// finished before this mount; start primed so that doesn't replay the
		// celebration, which should only fire on the actual finishing move.
		let lastGameEnded = store.gameEnded()

		function syncEndBanner() {
			if (store.gameEnded()) {
				endBanner.classList.remove(styles.hidden!)
				if (!lastGameEnded) {
					lastGameEnded = true
					confetti?.addConfetti()
					void audioPlayer.playGameEndFanfare()
				}
			}
			else {
				endBanner.classList.add(styles.hidden!)
				lastGameEnded = false
			}
		}

		function syncMenuActions() {
			const noProgress = !store.hasProgress()
			const noUndo = !store.canUndo()
			if (newGameDisabledStore.value !== noProgress) newGameDisabledStore.update(() => noProgress)
			if (undoDisabledStore.value !== noUndo) undoDisabledStore.update(() => noUndo)
		}

		syncEndBanner()
		syncMenuActions()

		store.on('change', signal, () => {
			syncEndBanner()
			syncMenuActions()
		})

		// Reset the shared menu-action flags when the game page unmounts so
		// other routes (Rules, Accessibility) see New game / Undo disabled.
		signal.addEventListener('abort', () => {
			if (!newGameDisabledStore.value) newGameDisabledStore.update(() => true)
			if (!undoDisabledStore.value) undoDisabledStore.update(() => true)
		})

		window.addEventListener('five-dice:new-game', () => {
			if (confirm(localization.text`Start a new game? This will clear the current score pad.`)) {
				store.reset()
			}
		}, { signal })

		window.addEventListener('five-dice:undo', () => {
			if (!store.canUndo()) return
			if (confirm(localization.text`Undo your last committed round?`)) store.undo()
		}, { signal })

		append(
			create(ScoreCard, { game, openRequest }),
			endBanner,
			create(ScoreInput, { game, openRequest }),
		)
	},
})
