import { component } from '@rooted/components'

import { Icon } from '../../_shared/icon/icon.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { MenuRow } from '../../_shared/menu/menu-row.mts'

import { figure, proseBlock } from './parts.mts'
import styles from '../how-to-play.css'

import undoIcon from '../../_shared/menu/menu-content.undo.svg?raw'

/** The "Undo last turn" row, shown where it actually lives. */
export const GuideUndo = component({
	name: 'guide-undo',
	styles,
	async onMount({ append, element, create }) {
		const prose = await localization.branch({
			en: () => import('./undo.en.md'),
			nl: () => import('./undo.nl.md'),
		})

		const context = {
			element,
			create,
		}

		append(
			proseBlock(context, prose),
			figure(context, localization.text`From the menu, any time`,
				create(MenuRow, {
					label: localization.text`Undo last turn`,
					hint: localization.text`Revert the last committed score`,
					control: create(Icon, {
						source: undoIcon,
					}),
				})
			),
		)
	},
})
