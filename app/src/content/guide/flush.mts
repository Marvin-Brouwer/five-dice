import { component } from '@rooted/components'

import { localization } from '../../_shared/i18n/localization.mts'

import { proseBlock } from './parts.mts'
import styles from '../how-to-play.css'

/** What the flush row does. Prose only — the score card shows the rest. */
export const GuideFlush = component({
	name: 'guide-flush',
	styles,
	async onMount({ append, element, create }) {
		const prose = await localization.branch({
			en: () => import('./flush.en.md'),
			nl: () => import('./flush.nl.md'),
		})

		append(
			proseBlock(
				{ element, create },
				prose
			)
		)
	},
})
