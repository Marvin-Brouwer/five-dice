import { cookieStorage } from '@rooted/storage/web'
import { createStore } from '@rooted/store'

export type Theme = 'system' | 'sensor' | 'light' | 'dark'

const COOKIE_NAME = 'theme'

function readInitialTheme(): Theme {
	const stored = cookieStorage.get<string>(COOKIE_NAME)
	if (stored === 'system' || stored === 'sensor' || stored === 'light' || stored === 'dark') return stored
	// Back-compat: previous versions used 'auto'
	if (stored === 'auto') return 'system'
	return 'system'
}

export const themeStore = createStore<Theme>(readInitialTheme())

if (typeof document !== 'undefined') {
	themeStore.on('change', new AbortController().signal, ({ detail }) => {
		cookieStorage.set(COOKIE_NAME, detail.state)
	})
}
