import { cookieStorage } from '@rooted/storage/web'

/**
 * How long a remembered preference survives on disk.
 *
 * Chrome and Safari cap a cookie's lifetime at 400 days and silently trim
 * anything longer, so asking for more buys nothing.
 */
const MAX_AGE_DAYS = 400
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000

/**
 * Writes a user preference to a cookie that outlives the browser session.
 *
 * The two-argument `cookieStorage.set(name, value)` leaves `Expires` off, and
 * a cookie without one is a session cookie: the browser drops it when the last
 * window closes, so the preference is back to its default the next time the
 * app is opened. Every preference meant to be remembered goes through here.
 *
 * Call it on read as well as on write — re-stamping the expiry keeps the
 * preference of someone who keeps using the app from ageing out, and upgrades
 * a session cookie written by an older version in place.
 */
export function setPreferenceCookie(name: string, value: string): void {
	cookieStorage.set({
		name,
		value,
		expires: Date.now() + MAX_AGE_MS,
		sameSite: 'lax',
	})
}
