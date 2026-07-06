import { component } from '@rooted/components'

import { menuStore } from '../_shared/stores/menuStore.mts'
import { PipDie } from '../_shared/die/pip-die.mts'

import styles from './app-bar.css'

const kebabSvg = `
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
		stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
		<circle cx="5" cy="12" r="1.4"/>
		<circle cx="12" cy="12" r="1.4"/>
		<circle cx="19" cy="12" r="1.4"/>
	</svg>
`

export const AppBar = component({
	name: 'app-bar',
	styles,
	onMount({ append, element, create, signal }) {
		const skipLink = element('a', {
			classes: styles.skipLink,
			href: '#main-content',
			textContent: 'Skip to main content',
		})

		const monogram = element('span', {
			classes: styles.monogram,
			aria: { label: 'Five dice' },
			children: create(PipDie, { value: 5, ariaLabel: 'Five dice' }),
		})

		const breadcrumb = element('span', {
			classes: styles.breadcrumb,
			textContent: 'Five dice',
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
