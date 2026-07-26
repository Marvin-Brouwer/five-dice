import { configureLocalization } from '@rooted/localization'

export const localization = configureLocalization({
	default: 'en',
	dictionaries: {
		nl: () => import('./dictionaries/nl.mts'),
	},
})

export const localeLabels: Record<typeof localization.Locale, string> = {
	en: 'English',
	nl: 'Nederlands',
}
