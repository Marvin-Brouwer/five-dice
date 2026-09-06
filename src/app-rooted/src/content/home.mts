import { component } from '@rooted/components'
import { Markdown } from '@rooted/markdown'

import { StartGameButton } from '../game/start-game-button.mts'
import { ContentCard } from '../_layout/content-card.mts'
import { localization } from '../_shared/i18n/localization.mts'

import { HowToButton } from './how-to-button.mts'

import styles from './home.css'

export const Home = component({
	name: 'home-page',
	styles,
	async onMount({ append, element, create }) {

		const source = await localization.branch({
			en: () => import('./home.en.md'),
			nl: () => import('./home.nl.md'),
		})

		append(
			create(ContentCard, {
				children: element('div', {
					classes: styles.hero,
					children: [
						create(Markdown, {
							source
						}),
						element('p', {
							classes: styles.actions,
							children: [
								create(HowToButton),
								create(StartGameButton),
							],
						}),
					],
				}),
			})
		)
	},
})
