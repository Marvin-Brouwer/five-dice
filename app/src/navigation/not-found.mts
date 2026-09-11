import { component } from '@rooted/components'
import { href, Link } from '@rooted/router'

import { HomeRoute } from '../content/_routes.mts'

import styles from './not-found.css'

export const NotFoundPage = component({
	name: 'not-found-page',
	styles,
	onMount({ append, element, create }) {
		append(element('article', {
			classes: styles.page,
			children: [
				element('h1', {
					textContent: 'Page not found'
				}),
				element('p', {
					textContent: 'The page you are looking for does not exist or has been moved.',
				}),
				element('p', {
					children: [
						create(Link, {
							// Forced to English: this fallback only fires for URLs
							// that don't carry a recognized locale segment at all.
							href: href.for(HomeRoute, {
								locale: 'en'
							}),
							classes: styles.link,
							children: '← Back to home',
						}),
					],
				}),
			],
		}))
	},
})
