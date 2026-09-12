import { localStorage } from '@rooted/storage/web'

import { localization } from './localization.mts'

const STORAGE_KEY = 'locale'

export function setLocale(locale: typeof localization.Locale): void {
	localStorage.set(STORAGE_KEY, locale)
}

export function getLocale(): string | undefined {
	return localStorage.get<string>(STORAGE_KEY)
}
