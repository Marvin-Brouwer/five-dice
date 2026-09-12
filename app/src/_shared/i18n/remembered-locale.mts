import { cookieStorage } from '@rooted/storage/web'

import { setPreferenceCookie } from '../stores/preference-cookie.mts'

import { localization } from './localization.mts'

const COOKIE_NAME = 'locale'

export function setLocale(locale: typeof localization.Locale): void {
	setPreferenceCookie(COOKIE_NAME, locale)
}

export function getLocale(): string | undefined {
	return cookieStorage.get<string>(COOKIE_NAME)
}
