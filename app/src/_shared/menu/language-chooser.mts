import { component } from '@rooted/components'
import { href, navigate } from '@rooted/router'

import { localeLabels, localization, Locale } from '../i18n/localization.mts'
import { setLocale } from '../i18n/remembered-locale.mts'

import { DropDown, type DropDownApi } from './drop-down.mts'
import styles from './language-chooser.css'

const LABELS: Record<Locale, { short: string, long: string }> = {
	en: { short: 'EN', long: localeLabels.en },
	nl: { short: 'NL', long: localeLabels.nl },
}

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
	onMount({ append, element, create }) {
		const activeLocale = localization.currentLocale

		let dropdown: DropDownApi | undefined

		append(
			create(DropDown, {
				label: localization.text`Language`,
				valueLabel: () => LABELS[activeLocale].long,
				trigger: () => [
					element('span', {
						classes: styles.short,
						textContent: LABELS[activeLocale].short,
					}),
					element('span', {
						classes: styles.long,
						textContent: LABELS[activeLocale].long,
					}),
				],
				items: () => localization.supportedLocales.map(code => {
					const selected = code === activeLocale
					return {
						selected,
						content: [
							element('span', {
								classes: styles.optionShort,
								textContent: LABELS[code].short,
							}),
							element('span', {
								classes: styles.optionLong,
								textContent: LABELS[code].long,
							}),
						],
						onSelect() {
							dropdown?.close()
							// Re-picking the active locale is a no-op: nothing will
							// navigate, so nothing will ever come back to re-enable
							// the trigger below. Just close and stop.
							if (selected) return
							// Disabled until the ancestor MenuContent (already wrapped
							// in localization.localized) rebuilds this component fresh
							// on the popstate navigate() fires, rather than updating
							// this button's own label ahead of the rest of the UI.
							dropdown?.disableTrigger()
							setLocale(code)
							navigate(href.path(pathForLocale(code)))
						},
					}
				}),
				reference: api => {
					dropdown = api
				},
			}),
		)
	},
})
