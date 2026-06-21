import { component } from '@rooted/components'

import { availableLanguages, type Language, languageStore } from '../stores/languageStore.mts'

import styles from './language-selector.css'

const labels: Record<Language, string> = {
	en: 'English',
}

export const LanguageSelector = component({
	name: 'language-selector',
	styles,
	onMount({ append, element }) {
		const select = element('select', {
			id: 'language-selector',
			classes: styles.select,
			aria: { label: 'Language' },
			on: {
				change(event) {
					const value = (event.currentTarget as HTMLSelectElement).value as Language
					languageStore.update(() => value)
				},
			},
			children: availableLanguages.map(lang => element('option', {
				value: lang,
				textContent: labels[lang],
				selected: lang === languageStore.value,
			})),
		})

		append(
			element('label', {
				classes: styles.label,
				htmlFor: 'language-selector',
				textContent: 'Language',
			}),
			select,
		)
	},
})
