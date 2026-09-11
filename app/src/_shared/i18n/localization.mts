import { configureLocalization } from '@rooted/localization'

export const localization = configureLocalization({
	default: 'en',
	dictionaries: {
		nl: () => import('./dictionaries/nl.mts'),
	},
})

/**
 * How each locale names itself, in its own language.
 *
 * `short` is not derived from the key: region-tagged locales are supported, and
 * `'nl-NL'.toUpperCase()` would not fit where a two-letter code is expected.
 */
export const localeLabels: Record<typeof localization.Locale, { short: string, long: string }> = {
	en: {
		short: 'EN',
		long: 'English',
	},
	nl: {
		short: 'NL',
		long: 'Nederlands',
	},
}

export type Locale = typeof localization.Locale