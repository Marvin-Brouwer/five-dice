import { cookieStorage, localStorage } from '@rooted/storage/web'
import { createStore } from '@rooted/store'

export type Theme = 'system' | 'sensor' | 'light' | 'dark'

const STORAGE_KEY = 'theme'

function isTheme(value: string | undefined): value is Theme {
	return value === 'system' || value === 'sensor' || value === 'light' || value === 'dark'
}

/**
 * The theme used to live in a cookie, which the browser dropped at the end of
 * the session unless it was given an expiry. Carry an existing choice over
 * once, then drop the cookie — nothing reads it any more.
 */
function migrateCookie(): Theme | undefined {
	const stored = cookieStorage.get<string>(STORAGE_KEY)
	if (stored === undefined) return undefined
	cookieStorage.removeItem(STORAGE_KEY)
	// Versions older still used 'auto' for what is now 'system'.
	const migrated = stored === 'auto' ? 'system' : stored
	if (!isTheme(migrated)) return undefined
	localStorage.set(STORAGE_KEY, migrated)
	return migrated
}

function readInitialTheme(): Theme {
	const stored = localStorage.get<string>(STORAGE_KEY)
	if (isTheme(stored)) return stored
	return migrateCookie() ?? 'system'
}

export const themeStore = createStore<Theme>(readInitialTheme())

themeStore.on('change', ({ detail }) => {
	localStorage.set(STORAGE_KEY, detail.state)
})
