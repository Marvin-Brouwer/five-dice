import { component } from '@rooted/components'
import { href } from '@rooted/router'

import { ActionButton } from '../_shared/action-button/action-button.mts'
import { localization } from '../_shared/i18n/localization.mts'

import { ScoreCardRoute } from './_routes.mts'
import playIcon from './start-game-button.play.svg?raw'

/**
 * The way into a game, wherever a page offers one.
 *
 * Every page that sends someone to the score pad sends them with the same
 * words, the same glyph and the same row — so the landing page's call to
 * action and the one at the foot of the guide are one control in two places,
 * not two that happen to agree today.
 *
 * Always `primary`: on any page that has one of these, starting a game is the
 * first move by definition.
 */
export const StartGameButton = component({
	name: 'start-game-button',
	onMount({ append, create }) {
		append(
			create(ActionButton, {
				variant: 'primary',
				href: href.for(ScoreCardRoute, {
					locale: localization.currentLocale
				}),
				label: localization.text`Start a new game`,
				hint: localization.text`Let's go!`,
				glyph: playIcon,
			})
		)
	},
})
