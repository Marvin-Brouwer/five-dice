import { component } from '@rooted/components'

import { availableLanguages, languageStore, type Language } from '../stores/languageStore.mts'

import { attachDropdown } from './dropdown-controller.mts'
import styles from './language-chooser.css'

const LABELS: Record<Language, { short: string, long: string }> = {
	en: { short: 'EN', long: 'English' },
}

const chevron = `
	<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M6 9l6 6 6-6"/>
	</svg>
`

const check = `
	<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M5 12l5 5L20 7"/>
	</svg>
`

export const LanguageChooser = component({
	name: 'language-chooser',
	styles,
	onMount({ append, element, signal, on }) {
		const short = element('span', {
			classes: styles.short,
			textContent: LABELS[languageStore.value].short,
		})
		const long = element('span', {
			classes: styles.long,
			textContent: LABELS[languageStore.value].long,
		})
		const buttonChevron = element('span', { classes: styles.chevron })
		buttonChevron.innerHTML = chevron

		const button = element('button', {
			type: 'button',
			classes: styles.button,
			aria: { hasPopup: 'listbox', label: `Language: ${LABELS[languageStore.value].long}` },
			children: [short, long, buttonChevron],
		})

		const list = element('div', {
			role: 'listbox',
			aria: { label: 'Language' },
			classes: styles.list,
		})

		function syncButton() {
			short.textContent = LABELS[languageStore.value].short
			long.textContent = LABELS[languageStore.value].long
			button.setAttribute('aria-label', `Language: ${LABELS[languageStore.value].long}`)
		}

		function buildOptions(): Node[] {
			return availableLanguages.map((code) => {
				const selected = code === languageStore.value
				const option = element('div', {
					role: 'option',
					aria: { selected: String(selected) },
					classes: [styles.option, selected ? styles.optionSelected : undefined],
					on: {
						click(event) {
							event.stopPropagation()
							languageStore.update(() => code)
							dropdown.close()
						},
					},
					children: [
						element('span', { classes: styles.optionShort, textContent: LABELS[code].short }),
						element('span', { classes: styles.optionLong, textContent: LABELS[code].long }),
					],
				})
				if (selected) {
					const tick = element('span', { classes: styles.optionCheck })
					tick.innerHTML = check
					option.append(tick)
				}
				return option
			})
		}

		const dropdown = attachDropdown({ button, list, buildOptions, signal, on })

		languageStore.on('change', signal, () => {
			syncButton()
			dropdown.refresh()
		})

		append(
			element('div', {
				classes: styles.wrap,
				children: [button, list],
			}),
		)
	},
})
