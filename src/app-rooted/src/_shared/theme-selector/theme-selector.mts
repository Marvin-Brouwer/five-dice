import { component } from '@rooted/components'

import { type Theme, themeStore } from '../stores/themeStore.mts'

import styles from './theme-selector.css'

const options: Array<{ value: Theme, label: string }> = [
	{ value: 'auto', label: 'Auto (system)' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
]

export const ThemeSelector = component({
	name: 'theme-selector',
	styles,
	onMount({ append, element }) {
		const select = element('select', {
			id: 'theme-selector',
			classes: styles.select,
			aria: { label: 'Color theme' },
			on: {
				change(event) {
					const value = (event.currentTarget as HTMLSelectElement).value as Theme
					themeStore.update(() => value)
				},
			},
			children: options.map(opt => element('option', {
				value: opt.value,
				textContent: opt.label,
				selected: opt.value === themeStore.value,
			})),
		})

		append(
			element('label', {
				classes: styles.label,
				htmlFor: 'theme-selector',
				textContent: 'Theme',
			}),
			select,
		)
	},
})
