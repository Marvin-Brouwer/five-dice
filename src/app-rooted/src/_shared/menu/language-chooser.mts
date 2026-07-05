import { component } from '@rooted/components'

import { availableLanguages, languageStore, type Language } from '../stores/languageStore.mts'

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
		let listOpen = false

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
			aria: { hasPopup: 'listbox', expanded: 'false', label: `Language: ${LABELS[languageStore.value].long}` },
			children: [short, long, buttonChevron],
			on: {
				click(event) {
					event.stopPropagation()
					listOpen = !listOpen
					renderList()
				},
			},
		})

		const list = element('div', {
			role: 'listbox',
			aria: { label: 'Language' },
			classes: styles.list,
		})
		list.hidden = true

		function syncButton() {
			short.textContent = LABELS[languageStore.value].short
			long.textContent = LABELS[languageStore.value].long
			button.setAttribute('aria-label', `Language: ${LABELS[languageStore.value].long}`)
		}

		function positionList() {
			const rect = button.getBoundingClientRect()
			list.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`
			list.style.bottom = `${window.innerHeight - rect.top + 6}px`
		}

		function renderList() {
			list.hidden = !listOpen
			button.setAttribute('aria-expanded', String(listOpen))
			if (!listOpen) {
				list.replaceChildren()
				list.style.right = ''
				list.style.bottom = ''
				return
			}
			positionList()
			list.replaceChildren(
				...availableLanguages.map((code) => {
					const selected = code === languageStore.value
					const option = element('div', {
						role: 'option',
						aria: { selected: String(selected) },
						classes: [styles.option, selected ? styles.optionSelected : undefined],
						on: {
							click(event) {
								event.stopPropagation()
								languageStore.update(() => code)
								listOpen = false
								renderList()
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
				}),
			)
		}

		languageStore.on('change', signal, syncButton)

		on('document', 'click', (event) => {
			if (!listOpen) return
			const target = event.target as Node | null
			if (target && (button.contains(target) || list.contains(target))) return
			listOpen = false
			renderList()
		})

		on('window', 'resize', () => {
			if (listOpen) positionList()
		})

		append(
			element('div', {
				classes: styles.wrap,
				children: [button, list],
			}),
		)
	},
})
