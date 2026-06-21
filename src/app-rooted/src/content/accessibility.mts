import { component } from '@rooted/components'

import styles from './accessibility.css'

export const Accessibility = component({
	name: 'accessibility-page',
	styles,
	onMount({ append, element }) {
		append(element('article', {
			classes: styles.page,
			children: [
				element('h1', { textContent: 'Accessibility statement' }),
				element('p', {
					textContent: 'Five dice aims to be usable for everyone. We aim for WCAG 2.1 Level AA compliance: every interactive control is reachable with the keyboard, focus is always visible, contrast ratios are met in both light and dark themes, and the dice and score input use native form controls so screen readers announce them as proper groups.',
				}),

				element('h2', { textContent: 'Keyboard support' }),
				element('p', {
					textContent: 'Every page can be operated with Tab, Shift+Tab, Enter, and Space. The score-input radio groups support the standard arrow-key navigation pattern.',
				}),

				element('h2', { textContent: 'Report an issue' }),
				element('p', {
					children: [
						'If you encounter an accessibility barrier, please ',
						element('a', {
							href: 'https://github.com/Marvin-Brouwer/five-dice/issues/new',
							target: '_blank',
							rel: 'noopener noreferrer',
							textContent: 'open an issue on GitHub',
						}),
						'.',
					],
				}),
			],
		}))
	},
})
