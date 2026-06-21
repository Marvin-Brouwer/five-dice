import { component } from '@rooted/components'

import styles from './footer.css'

export const Footer = component({
	name: 'app-footer',
	styles,
	onMount({ append, element }) {
		append(
			element('footer', {
				classes: styles.footer,
				children: [
					element('p', {
						classes: styles.tagline,
						children: [
							'Built with the ',
							element('a', {
								href: 'https://github.com/Marvin-Brouwer/rooted',
								target: '_blank',
								rel: 'noopener noreferrer',
								textContent: 'Rooted framework',
							}),
							'. Source on ',
							element('a', {
								href: 'https://github.com/Marvin-Brouwer/five-dice',
								target: '_blank',
								rel: 'noopener noreferrer',
								textContent: 'GitHub',
							}),
							'.',
						],
					}),
				],
			}),
		)
	},
})
