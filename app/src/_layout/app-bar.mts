import { component } from '@rooted/components'
import { href, Link } from '@rooted/router'

import { HomeRoute } from '../content/_routes.mts'
import { Icon } from '../_shared/icon/icon.mts'
import { localization } from '../_shared/i18n/localization.mts'
import { menuStore } from '../_shared/stores/menuStore.mts'
import { PipDie } from '../_shared/die/pip-die.mts'

import kebabIcon from './app-bar.kebab.svg?raw'
import styles from './app-bar.css'

export const AppBar = component({
	name: 'app-bar',
	styles,
	onMount({ append, element, create, signal }) {
		const skipLink = element('a', {
			classes: styles.skipLink,
			href: '#main-content',
			textContent: localization.text`Skip to main content`,
		})

		// Hidden from assistive tech: the breadcrumb next to it already reads
		// "Five dice", and both live inside the same link.
		const monogram = element('span', {
			classes: styles.monogram,
			aria: {
				hidden: 'true'
			},
			children: create(PipDie, {
				value: 5,
			}),
		})

		const breadcrumb = element('span', {
			classes: styles.breadcrumb,
			textContent: 'Five dice',
		})

		const kebab = element('button', {
			type: 'button',
			classes: styles.kebab,
			aria: {
				label: localization.text`Menu`,
				expanded: String(menuStore.value)
			},
			on: {
				click() {
					menuStore.update(open => !open)
				},
			},
			children: create(Icon, {
				source: kebabIcon,
			}),
		})

		menuStore.on('change', signal, ({ detail }) => {
			kebab.setAttribute('aria-expanded', String(detail.state))
		})

		append(
			skipLink,
			element('header', {
				classes: styles.bar,
				children: [
					create(Link, {
						href: href.for(HomeRoute, {
							locale: localization.currentLocale
						}),
						classes: styles.title,
						children: [monogram, breadcrumb],
					}),
					kebab,
				],
			}),
		)
	},
})
