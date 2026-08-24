import { component } from '@rooted/components'

import { createGameContext } from './_logic/game-context.mts'
import { wireGameCelebration } from './game.celebration.mts'
import { wireGameMenuBridge } from './game.menu-bridge.mts'
import { ScoreCard } from './score-card/score-card.mts'
import { ScoreInput } from './score-input/score-input.mts'

import styles from './game.css'

/**
 * The score-card page.
 *
 * Builds the one game context every part of the page shares, then composes.
 * Nothing here re-renders — each child owns its own store subscriptions.
 */
export const Game = component({
	name: 'game-page',
	styles,
	onMount({ append, element, create, signal, on }) {
		const game = createGameContext()

		wireGameMenuBridge({ signal, on, store: game.pad })
		wireGameCelebration({ signal, on, store: game.pad })

		append(
			element('div', {
				classes: styles.page,
				children: [
					create(ScoreCard, {
						game,
					}),
					create(ScoreInput, {
						game,
					}),
				],
			})
		)
	},
})
