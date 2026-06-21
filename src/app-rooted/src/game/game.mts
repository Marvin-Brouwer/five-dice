import { component } from '@rooted/components'
import JSConfetti from 'js-confetti'

import { playGameEndFanfare } from './audio/audio.ts'
import { ScoreCard } from './score-card/score-card.mts'
import { ScoreInput } from './score-input/score-input.mts'
import { createScorePadStore } from './_logic/scorePadStore.mts'

import styles from './game.css'

export const Game = component({
	name: 'game-page',
	styles,
	onMount({ append, element, create, signal }) {
		const store = createScorePadStore()

		const undoButton = element('button', {
			type: 'button',
			classes: styles.toolbarButton,
			textContent: 'Undo last round',
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

		const inputWrapper = element('section', {
			classes: styles.inputWrapper,
			aria: { label: 'Score input' },
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
			undoButton.disabled = !store.canUndo() || store.gameEnded()
		}

		function syncInputVisibility() {
			if (store.gameEnded()) {
				inputWrapper.classList.add(styles.hidden!)
				endBanner.classList.remove(styles.hidden!)
				if (!lastGameEnded) {
					lastGameEnded = true
					confetti?.addConfetti()
					void playGameEndFanfare()
				}
			}
			else {
				inputWrapper.classList.remove(styles.hidden!)
				endBanner.classList.add(styles.hidden!)
				lastGameEnded = false
			}
		}

		syncToolbar()
		syncInputVisibility()
		inputWrapper.append(create(ScoreInput, { store }))

		store.on('change', signal, () => {
			syncToolbar()
			syncInputVisibility()
		})

		append(
			element('div', {
				classes: styles.toolbar,
				children: [resetButton, undoButton],
			}),
			create(ScoreCard, { store }),
			endBanner,
			inputWrapper,
		)
	},
})
