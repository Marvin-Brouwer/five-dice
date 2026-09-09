import { cookieStorage } from '@rooted/storage/web'

import { localization } from './localization.mts'

const COOKIE_NAME = 'locale'

/**
 * The app's own base, without its trailing slash.
 *
 * Written without an explicit `Path`, a cookie inherits the directory of the
 * page that wrote it (RFC 6265 "default-path"), so `/en/` and `/nl/` each got
 * a `locale` cookie of their own instead of overwriting one another — and the
 * root, matching neither, saw whichever one happened to be scoped highest.
 * Pinning the path makes it one cookie no matter which URL writes it.
 *
 * The trailing slash comes off because `Path=/five-dice` also matches
 * `/five-dice` itself, where `Path=/five-dice/` would not. A bare `/` base has
 * no slash to drop.
 */
const COOKIE_PATH = import.meta.env.BASE_URL.replace(/(.)\/$/, '$1')

export function setLocale(locale: typeof localization.Locale): void {
	cookieStorage.set({
		name: COOKIE_NAME,
		value: locale,
		path: COOKIE_PATH,
		sameSite: 'lax',
	})
}

export function getLocale(): string | undefined {
	return cookieStorage.get<string>(COOKIE_NAME)
}
