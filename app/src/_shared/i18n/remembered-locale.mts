import { cookieStorage, localStorage } from '@rooted/storage/web'

import { localization } from './localization.mts'

const STORAGE_KEY = 'locale'

export function setLocale(locale: typeof localization.Locale): void {
	localStorage.set(STORAGE_KEY, locale)
}

export function getLocale(): string | undefined {
	return localStorage.get<string>(STORAGE_KEY)
}

/**
 * The locale used to live in a cookie too. Carry an existing choice over once,
 * then drop the cookie — nothing reads it any more.
 *
 * `LocaleSync` rewrites this on every navigation, so the only load this
 * actually matters on is someone landing straight on `/`, where the remembered
 * locale is what decides where they get sent.
 */
const legacy = cookieStorage.get<string>(STORAGE_KEY)
if (legacy !== undefined) {
	cookieStorage.removeItem(STORAGE_KEY)
	if (getLocale() === undefined) localStorage.set(STORAGE_KEY, legacy)
}
