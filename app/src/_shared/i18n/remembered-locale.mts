import { cookieStorage } from '@rooted/storage/web'

import { localization } from './localization.mts'

const COOKIE_NAME = 'locale'

export function setLocale(locale: typeof localization.Locale): void {
	cookieStorage.set({
		name: COOKIE_NAME,
		value: locale,
		sameSite: 'lax',
	})
}

export function getLocale(): string | undefined {
	return cookieStorage.get<string>(COOKIE_NAME)
}
