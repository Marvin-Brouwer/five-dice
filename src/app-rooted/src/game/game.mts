import { component } from '@rooted/components'
import { createStore } from '@rooted/store'
import JSConfetti from 'js-confetti'

import { type ScoreField } from './_logic/gameConstants.ts'
import { isDiscarded, isFlushScore } from './_logic/score/score.ts'
import { playGameEndFanfare } from './audio/audio.ts'
import { ScoreCard } from './score-card/score-card.mts'
import { ScoreInput } from './score-input/score-input.mts'
import { createScorePadStore } from './_logic/scorePadStore.mts'

import styles from './game.css'

export const Game = component({
	name: 'game-page',
	styles,
	onMount({ append, element, create, signal, on }) {
		const store = createScorePadStore()
		const openRequest = createStore(false)

		function hasGameProgress(): boolean {
			const pad = store.value.pad
			for (const key of Object.keys(pad) as ScoreField[]) {
				const cell = pad[key]
				if (cell === undefined) continue
				if (key === 'flush' && !isDiscarded(cell) && isFlushScore(cell) && cell.length === 0) continue
				return true
			}
			return false
		}

		on('window', 'beforeunload', (event) => {
			if (!hasGameProgress()) return
			event.preventDefault()
			const message = 'You have a scorepad with changes, are you sure you want to reload the page?'
			event.returnValue = message
		})

		const enterScoreButton = element('button', {
			type: 'button',
			classes: styles.toolbarButton,
			textContent: 'Enter score',
			disabled: store.gameEnded(),
			on: {
				click() {
					if (store.gameEnded()) return
					openRequest.update(() => true)
				},
			},
		})

		const undoButton = element('button', {
			type: 'button',
			classes: styles.toolbarButton,
			textContent: 'Undo last turn',
			disabled: !store.canUndo(),
			on: {
				click() {
					if (!store.canUndo()) return
					if (confirm('Undo your last committed round?')) store.undo()
				},
			},
		})

		const resetButton = element('button', {
			type: 'button',
			classes: styles.toolbarButton,
			textContent: 'New game',
			on: {
				click() {
					if (confirm('Start a new game? This will clear the current score pad.')) {
						store.reset()
					}
				},
			},
		})

		const endBanner = element('aside', {
			classes: [styles.endBanner, styles.hidden],
			role: 'status',
			aria: { live: 'polite' },
			textContent: 'Game finished — review your score below.',
		})

		const confetti = typeof window !== 'undefined' ? new JSConfetti() : undefined
		let lastGameEnded = false

		function syncToolbar() {
			enterScoreButton.disabled = store.gameEnded()
			undoButton.disabled = !store.canUndo() || store.gameEnded()
		}

		function syncEndBanner() {
			if (store.gameEnded()) {
				endBanner.classList.remove(styles.hidden!)
				if (!lastGameEnded) {
					lastGameEnded = true
					confetti?.addConfetti()
					void playGameEndFanfare()
				}
			}
			else {
				endBanner.classList.add(styles.hidden!)
				lastGameEnded = false
			}
		}

		syncToolbar()
		syncEndBanner()

		store.on('change', signal, () => {
			syncToolbar()
			syncEndBanner()
		})

		append(
			element('div', {
				classes: styles.toolbar,
				children: [enterScoreButton, undoButton, resetButton],
			}),
			create(ScoreCard, { store }),
			endBanner,
			create(ScoreInput, { store, openRequest }),
		)
	},
})
