import { component } from '@rooted/components'
import { Markdown } from '@rooted/markdown'

import { ContentCard } from '../_layout/content-card.mts'
import { localization } from '../_shared/i18n/localization.mts'

import styles from './accessibility.css'

export const Accessibility = component({
	name: 'accessibility-page',
	styles,
	async onMount({ append, element, create }) {

		const source = await localization.branch({
			en: () => import('./accessibility.en.md'),
			nl: () => import('./accessibility.nl.md'),
		})

		append(
			create(ContentCard, {
				children: element('div', {
					classes: styles.statement,
					children: create(Markdown, {
						source
					}),
				}),
			})
		)
	},
})
