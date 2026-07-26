import { cookieStorage } from '@rooted/storage/web'

import { localization } from './localization.mts'

const COOKIE_NAME = 'locale'

export function rememberLocale(locale: typeof localization.Locale): void {
	cookieStorage.set(COOKIE_NAME, locale)
}

export function readRememberedLocale(): string | undefined {
	return cookieStorage.get<string>(COOKIE_NAME)
}
