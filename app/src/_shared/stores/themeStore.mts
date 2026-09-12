import { cookieStorage } from '@rooted/storage/web'
import { createStore } from '@rooted/store'

import { setPreferenceCookie } from './preference-cookie.mts'

export type Theme = 'system' | 'sensor' | 'light' | 'dark'

const COOKIE_NAME = 'theme'

function readInitialTheme(): Theme {
	const stored = cookieStorage.get<string>(COOKIE_NAME)
	if (stored === 'system' || stored === 'sensor' || stored === 'light' || stored === 'dark') return stored
	// Back-compat: previous versions used 'auto'
	if (stored === 'auto') return 'system'
	return 'system'
}

const initialTheme = readInitialTheme()

export const themeStore = createStore<Theme>(initialTheme)

themeStore.on('change', ({ detail }) => {
	setPreferenceCookie(COOKIE_NAME, detail.state)
})

// Re-stamp on load, so the cookie keeps its 400 days for as long as the app
// stays in use and a session cookie left by an older version is replaced.
setPreferenceCookie(COOKIE_NAME, initialTheme)
