import { component } from '@rooted/components'
import { href, Link } from '@rooted/router'

import { RulesRoute } from '../content/_routes.mts'
import { localization } from '../_shared/i18n/localization.mts'
import { routeTitleStore } from '../_shared/stores/routeTitleStore.mts'

import styles from './not-found.css'

export type NotFoundLocalizedOptions = {
	locale: typeof localization.Locale
}

export const NotFoundLocalized = component<NotFoundLocalizedOptions>({
	name: 'not-found-localized-page',
	styles,
	onMount({ append, element, create, options }) {
		routeTitleStore.update(() => 'Not found')
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
							href: href.for(RulesRoute, { locale: options.locale }),
							classes: styles.link,
							children: '← Back to home',
						}),
					],
				}),
			],
		}))
	},
})
