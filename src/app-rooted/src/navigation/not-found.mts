import { component } from '@rooted/components'
import { href, Link } from '@rooted/router'

import styles from './not-found.css'

export const NotFoundPage = component({
	name: 'not-found-page',
	styles,
	onMount({ append, element, create }) {
		append(element('article', {
			classes: styles.page,
			children: [
				element('h1', { textContent: 'Page not found' }),
				element('p', {
					textContent: 'The page you are looking for does not exist or has been moved.',
				}),
				element('p', {
					children: [
						create(Link, {
							href: href.path('/'),
							classes: styles.link,
							children: '← Back to home',
						}),
					],
				}),
			],
		}))
	},
})
