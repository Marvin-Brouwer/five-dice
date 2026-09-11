import { component } from '@rooted/components'

import { Icon } from '../_shared/icon/icon.mts'
import { localization } from '../_shared/i18n/localization.mts'
import { MenuRow } from '../_shared/menu/menu-row.mts'

import { figure, proseBlock } from './guide-parts.mts'
import styles from './how-to-play.css'

import refreshIcon from '../_shared/menu/menu-content.refresh.svg?raw'

/** The "New game" row, shown where it actually lives. */
export const GuideEnding = component({
	name: 'guide-ending',
	styles,
	async onMount({ append, element, create }) {
		const prose = await localization.branch({
			en: () => import('./how-to-play-ending.en.md'),
			nl: () => import('./how-to-play-ending.nl.md'),
		})

		const context = { element, create }

		append(
			proseBlock(context, prose),
			figure(context, localization.text`Ready for the next one`,
				create(MenuRow, {
					label: localization.text`New game`,
					hint: localization.text`Reset the score pad`,
					control: create(Icon, {
						source: refreshIcon,
					}),
				})
			),
		)
	},
})
