import { component } from '@rooted/components'
import { href, navigate } from '@rooted/router'

import { localeLabels, localization } from '../i18n/localization.mts'
import { rememberLocale } from '../i18n/remembered-locale.mts'

import { attachDropdown } from './dropdown-controller.mts'
import styles from './language-chooser.css'

type Locale = typeof localization.Locale

const LABELS: Record<Locale, { short: string, long: string }> = {
	en: { short: 'EN', long: localeLabels.en },
	nl: { short: 'NL', long: localeLabels.nl },
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

/** Swaps the locale segment of the current path, keeping the rest of the URL intact. */
function pathForLocale(locale: Locale): string {
	const current = href.current().pathOnly
	const segment = current.split('/')[1]
	const isLocale = (localization.supportedLocales as readonly string[]).includes(segment)
	const rest = isLocale ? current.slice(1 + segment.length) : current
	return `/${locale}${rest}`
}

export const LanguageChooser = component({
	name: 'language-chooser',
	styles,
	onMount({ append, element, signal, on }) {
		let activeLocale = localization.currentLocale

		const short = element('span', {
			classes: styles.short,
			textContent: LABELS[activeLocale].short,
		})
		const long = element('span', {
			classes: styles.long,
			textContent: LABELS[activeLocale].long,
		})
		const buttonChevron = element('span', { classes: styles.chevron })
		buttonChevron.innerHTML = chevron

		const button = element('button', {
			type: 'button',
			classes: styles.button,
			aria: { hasPopup: 'listbox', label: `Language: ${LABELS[activeLocale].long}` },
			children: [short, long, buttonChevron],
		})

		const list = element('div', {
			role: 'listbox',
			aria: { label: 'Language' },
			classes: styles.list,
		})

		function syncButton() {
			activeLocale = localization.currentLocale
			short.textContent = LABELS[activeLocale].short
			long.textContent = LABELS[activeLocale].long
			button.setAttribute('aria-label', `Language: ${LABELS[activeLocale].long}`)
		}

		function buildOptions(): Node[] {
			return localization.supportedLocales.map((code) => {
				const selected = code === activeLocale
				const option = element('div', {
					role: 'option',
					aria: { selected: String(selected) },
					classes: [styles.option, selected ? styles.optionSelected : undefined],
					on: {
						click(event) {
							event.stopPropagation()
							rememberLocale(code)
							navigate(href.path(pathForLocale(code)))
							activeLocale = code
							syncButton()
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

		on('window', 'popstate', () => {
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
