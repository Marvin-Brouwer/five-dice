import { component } from '@rooted/components'

import { menuStore } from '../_shared/stores/menuStore.mts'
import { routeTitleStore } from '../_shared/stores/routeTitleStore.mts'

import styles from './app-bar.css'

const kebabSvg = `
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
		stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
		<circle cx="5" cy="12" r="1.4"/>
		<circle cx="12" cy="12" r="1.4"/>
		<circle cx="19" cy="12" r="1.4"/>
	</svg>
`

const fiveDieSvg = `
	<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
		<circle cx="6"  cy="6"  r="2.1" fill="currentColor"/>
		<circle cx="18" cy="6"  r="2.1" fill="currentColor"/>
		<circle cx="12" cy="12" r="2.1" fill="currentColor"/>
		<circle cx="6"  cy="18" r="2.1" fill="currentColor"/>
		<circle cx="18" cy="18" r="2.1" fill="currentColor"/>
	</svg>
`

export const AppBar = component({
	name: 'app-bar',
	styles,
	onMount({ append, element, signal }) {
		const skipLink = element('a', {
			classes: styles.skipLink,
			href: '#main-content',
			textContent: 'Skip to main content',
		})

		const monogram = element('span', {
			classes: styles.monogram,
			aria: { label: 'Five dice' },
		})
		monogram.innerHTML = fiveDieSvg

		const breadcrumb = element('span', {
			classes: styles.breadcrumb,
			textContent: routeTitleStore.value,
		})

		routeTitleStore.on('change', signal, ({ detail }) => {
			breadcrumb.textContent = detail.state
		})

		const kebab = element('button', {
			type: 'button',
			classes: styles.kebab,
			aria: { label: 'Menu', expanded: String(menuStore.value) },
			on: {
				click() {
					menuStore.update(open => !open)
				},
			},
		})
		kebab.innerHTML = kebabSvg

		menuStore.on('change', signal, ({ detail }) => {
			kebab.setAttribute('aria-expanded', String(detail.state))
		})

		append(
			skipLink,
			element('header', {
				classes: styles.bar,
				children: [
					element('span', {
						classes: styles.title,
						children: [monogram, breadcrumb],
					}),
					kebab,
				],
			}),
		)
	},
})
