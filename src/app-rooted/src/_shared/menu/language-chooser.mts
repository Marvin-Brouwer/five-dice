import { component, cssClass } from '@rooted/components'
import { href, navigate } from '@rooted/router'

import { localeLabels, localization, Locale } from '../i18n/localization.mts'
import { rememberLocale } from '../i18n/remembered-locale.mts'

import { attachDropdown } from './dropdown-controller.mts'
import styles from './language-chooser.css'

const LABELS: Record<Locale, { short: string, long: string }> = {
	en: { short: 'EN', long: localeLabels.en },
	nl: { short: 'NL', long: localeLabels.nl },
}

// TODO direct import all svg instead
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
		const activeLocale = localization.currentLocale

		const button = element('button', {
			type: 'button',
			classes: styles.button,
			aria: {
				hasPopup: 'listbox',
				label: localization.text`Language: ${LABELS[activeLocale].long}`
			},
			children: [
				element('span', {
					classes: styles.short,
					textContent: LABELS[activeLocale].short,
				}),
				element('span', {
					classes: styles.long,
					textContent: LABELS[activeLocale].long,
				}),
				element('span', {
					classes: styles.chevron,
					innerHTML: chevron
				})
			],
		})

		const list = element('div', {
			role: 'listbox',
			aria: {
				label: localization.text`Language`
			},
			classes: styles.list,
		})

		function buildOptions(): Node[] {
			return localization.supportedLocales.map((code) => {
				const selected = code === activeLocale
				const option = element('div', {
					role: 'option',
					aria: { selected: String(selected) },
					classes: [
						cssClass(styles.option),
						cssClass(styles.optionSelected, selected)
					],
					on: {
						click(event) {
							event.stopPropagation()
							dropdown.close()
							// Re-picking the active locale is a no-op: nothing will
							// navigate, so nothing will ever come back to re-enable
							// the button below. Just close and stop.
							if (selected) return
							// Disabled until the ancestor MenuContent (already wrapped
							// in localization.localized) rebuilds this component fresh
							// on the popstate navigate() fires, rather than updating
							// this button's own label ahead of the rest of the UI.
							button.disabled = true
							rememberLocale(code)
							navigate(href.path(pathForLocale(code)))
						},
					},
					children: [
						element('span', {
							classes: styles.optionShort,
							textContent: LABELS[code].short
						}),
						element('span', {
							classes: styles.optionLong,
							textContent: LABELS[code].long
						}),
						...selected ? [element('span', {
							classes: styles.optionCheck,
							innerHTML: check
						})] : []
					],
				})

				return option
			})
		}

		const dropdown = attachDropdown({ button, list, buildOptions, signal, on })

		append(
			element('div', {
				classes: styles.wrap,
				children: [button, list],
			}),
		)
	},
})
