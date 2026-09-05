import { component } from '@rooted/components'
import { Markdown } from '@rooted/markdown'
import { href, Link } from '@rooted/router'

import { ScoreCardRoute } from '../game/_routes.mts'
import { getRowDisplayLabels } from '../game/score-card/score-card.labels.ts'
import { localization } from '../_shared/i18n/localization.mts'

import styles from './how-to-play.css'

export const HowToPlay = component({
	name: 'how-to-play-page',
	styles,
	async onMount({ append, element, create }) {
		// Prose lives in translated markdown; only the closing CTA and the
		// score-row list (data-driven, from score-card.labels.ts) stay as
		// component code, spliced back in at their original positions.
		const { intro, outro } = await localization.branch({
			en: async () => ({
				intro: await import('./how-to-play-intro.en.md'),
				outro: await import('./how-to-play-outro.en.md'),
			}),
			nl: async () => ({
				intro: await import('./how-to-play-intro.nl.md'),
				outro: await import('./how-to-play-outro.nl.md'),
			}),
		})

		append(
			element('article', {
				classes: styles.page,
				children: [
					create(Markdown, {
						source: intro
					}),
					element('ul', {
						classes: styles.scoreOptions,
						children: Object.entries(getRowDisplayLabels()).map(([, label]) => element('li', {
							children: [
								element('strong', {
									textContent: `${label.title}: `
								}),
								element('span', {
									textContent: label.scoreDescription.long
								}),
							],
						})),
					}),
					create(Markdown, {
						source: outro
					}),
					element('p', {
						children: create(Link, {
							href: href.for(ScoreCardRoute, {
								locale: localization.currentLocale
							}),
							classes: styles.cta,
							children: localization.text`Start a new game`,
						}),
					}),
				],
			})
		)
	},
})
