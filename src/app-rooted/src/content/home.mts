import { component } from '@rooted/components'
import { Markdown } from '@rooted/markdown'
import { href, Link } from '@rooted/router'

import { ScoreCardRoute } from '../game/_routes.mts'
import { ContentCard } from '../_layout/content-card.mts'
import { DiceHero } from '../_shared/dice-hero/dice-hero.mts'
import { localization } from '../_shared/i18n/localization.mts'

import { HowToPlayRoute } from './_routes.mts'

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
						create(DiceHero),
						create(Markdown, {
							source
						}),
						element('p', {
							classes: styles.actions,
							children: [
								create(Link, {
									href: href.for(HowToPlayRoute, {
										locale: localization.currentLocale
									}),
									classes: styles.ctaSecondary,
									children: localization.text`How to play`,
								}),
								create(Link, {
									href: href.for(ScoreCardRoute, {
										locale: localization.currentLocale
									}),
									classes: styles.cta,
									children: localization.text`Start a new game`,
								}),
							],
						}),
					],
				}),
			})
		)
	},
})
