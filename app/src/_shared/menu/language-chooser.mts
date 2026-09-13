import { component } from '@rooted/components'
import { href, navigate } from '@rooted/router'

import { localeLabels, localization, Locale } from '../i18n/localization.mts'
import { setLocale } from '../i18n/remembered-locale.mts'

import { DropDown, type DropDownApi } from './drop-down.mts'
import styles from './language-chooser.css'

/** Swaps the locale segment of the current path, keeping the rest of the URL intact. */
function pathForLocale(locale: Locale): string {
	const current = href.current().pathOnly
	const segment = current.split('/')[1]
	const isLocale = (localization.supportedLocales as readonly string[]).includes(segment)
	const rest = isLocale ? current.slice(1 + segment.length) : current
	return `/${locale}${rest}`
}

/**
 * Set on the way out of a locale switch, read by the chooser that replaces
 * this one.
 *
 * Picking a language navigates, which rebuilds the whole menu body — so the
 * trigger the keyboard user was standing on stops existing. Without this they
 * are dropped back to the top of the sheet by their own language switch.
 */
let focusOnMount = false

export const LanguageChooser = component({
	name: 'language-chooser',
	styles,
	onMount({ append, element, create }) {
		const activeLocale = localization.currentLocale

		let dropdown: DropDownApi | undefined

		append(
			create(DropDown, {
				label: localization.text`Language`,
				triggerLabel: () => localization.text`Language: ${localeLabels[activeLocale].long}`,
				trigger: () => [
					element('span', {
						classes: styles.short,
						textContent: localeLabels[activeLocale].short,
					}),
					element('span', {
						classes: styles.long,
						textContent: localeLabels[activeLocale].long,
					}),
				],
				items: () => localization.supportedLocales.map(code => {
					const selected = code === activeLocale
					return {
						label: localeLabels[code].long,
						selected,
						content: [
							element('span', {
								classes: styles.optionShort,
								textContent: localeLabels[code].short,
							}),
							element('span', {
								classes: styles.optionLong,
								textContent: localeLabels[code].long,
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
							// close() has already handed focus back to the trigger,
							// which is the element about to be replaced.
							focusOnMount = true
							setLocale(code)
							navigate(href.path(pathForLocale(code)))
						},
					}
				}),
				reference: api => {
					dropdown = api
					if (!focusOnMount) return
					focusOnMount = false
					api.focusTrigger()
				},
			}),
		)
	},
})
