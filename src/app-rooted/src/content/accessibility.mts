import { component } from '@rooted/components'
import { Markdown } from '@rooted/markdown'

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

		append(element('article', {
			classes: styles.page,
			children: create(Markdown, {
				source
			}),
		}))
	},
})
