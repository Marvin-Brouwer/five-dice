import { cookieStorage } from '@rooted/storage/web'
import { createStore } from '@rooted/store'

export type Theme = 'light' | 'dark' | 'auto'

const COOKIE_NAME = 'theme'

function readInitialTheme(): Theme {
	const stored = cookieStorage.get<string>(COOKIE_NAME)
	if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored
	return 'auto'
}

function applyTheme(theme: Theme) {
	if (typeof document === 'undefined') return
	document.documentElement.dataset.theme = theme
}

export const themeStore = createStore<Theme>(readInitialTheme())

if (typeof document !== 'undefined') {
	applyTheme(themeStore.value)
	themeStore.on('change', new AbortController().signal, ({ detail }) => {
		applyTheme(detail.state)
		cookieStorage.set(COOKIE_NAME, detail.state)
	})
}
