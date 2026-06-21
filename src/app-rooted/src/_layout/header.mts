import { component } from '@rooted/components'
import { href, Link } from '@rooted/router'

import { LanguageSelector } from '../_shared/language-selector/language-selector.mts'
import { ThemeSelector } from '../_shared/theme-selector/theme-selector.mts'

import styles from './header.css'

export const Header = component({
	name: 'app-header',
	styles,
	onMount({ append, element, create }) {
		append(
			element('a', {
				classes: styles.skipLink,
				href: '#main-content',
				textContent: 'Skip to main content',
			}),
			element('header', {
				classes: styles.header,
				children: [
					element('nav', {
						aria: { label: 'Main navigation' },
						classes: styles.nav,
						children: [
							create(Link, {
								href: href.path('/'),
								classes: styles.brand,
								children: 'Five dice',
							}),
							create(Link, {
								href: href.path('/score-card'),
								classes: styles.link,
								children: 'Play',
							}),
							create(Link, {
								href: href.path('/accessibility'),
								classes: styles.link,
								children: 'Accessibility',
							}),
						],
					}),
					element('div', {
						classes: styles.controls,
						children: [
							create(ThemeSelector),
							create(LanguageSelector),
						],
					}),
				],
			}),
		)
	},
})
