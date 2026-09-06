import { component } from '@rooted/components'
import { href, Link } from '@rooted/router'

import { HomeRoute } from '../content/_routes.mts'
import { localeLabels, localization } from '../_shared/i18n/localization.mts'
import { Masthead } from '../_shared/masthead/masthead.mts'
import { PaperCard } from '../_shared/paper-card/paper-card.mts'
import { readRememberedLocale } from '../_shared/i18n/remembered-locale.mts'

import styles from './culture-select.css'

function isSupportedLocale(value: string | undefined): value is typeof localization.Locale {
	return value !== undefined && (localization.supportedLocales as readonly string[]).includes(value)
}

export const CultureSelect = component({
	name: 'culture-select-page',
	styles,
	onMount({ append, element, create }) {
		const remembered = readRememberedLocale()
		if (isSupportedLocale(remembered)) {
			// Redirect via replaceState (not navigate/pushState) so `/` doesn't
			// leave a history entry that bounces straight back to this redirect.
			const target = href.for(HomeRoute, { locale: remembered })
			history.replaceState(undefined, '', target.href)
			window.dispatchEvent(new PopStateEvent('popstate', { state: undefined }))
			return
		}

		// Deliberately not localized. Shown before a locale is picked, so
		// there's no language to translate into. The list below already shows
		// each locale's native name.
		append(element('article', {
			classes: styles.page,
			children: create(PaperCard, {
				heading: create(Masthead),
				children: element('div', {
					classes: styles.content,
					children: [
						element('h2', {
							textContent: 'Choose your language'
						}),
						element('ul', {
							classes: styles.list,
							children: localization.supportedLocales.map(locale => element('li', {
								children: create(Link, {
									href: href.for(HomeRoute, { locale }),
									classes: styles.link,
									children: localeLabels[locale],
								}),
							})),
						}),
					],
				}),
			}),
		}))
	},
})
