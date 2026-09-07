import { component } from '@rooted/components'
import { href } from '@rooted/router'

import { ActionButton } from '../_shared/action-button/action-button.mts'
import { localization } from '../_shared/i18n/localization.mts'

import { HowToPlayRoute } from './_routes.mts'
import rulesIcon from './how-to-button.rules.svg?raw'

/**
 * The way to the rules, wherever a page offers one.
 *
 * StartGameButton's counterpart: same row, same words wherever it appears,
 * and always `secondary` — a page that offers both of these is offering to
 * explain the game or to start it, and starting it is the louder of the two.
 */
export const HowToButton = component({
	name: 'how-to-button',
	onMount({ append, create }) {
		append(
			create(ActionButton, {
				variant: 'secondary',
				href: href.for(HowToPlayRoute, {
					locale: localization.currentLocale
				}),
				label: localization.text`How to play`,
				hint: localization.text`About the game`,
				glyph: rulesIcon,
			})
		)
	},
})
