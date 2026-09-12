import { localStorage } from '@rooted/storage/web'
import { createStore } from '@rooted/store'

export type Theme = 'system' | 'sensor' | 'light' | 'dark'

const STORAGE_KEY = 'theme'

function isTheme(value: string | undefined): value is Theme {
	return value === 'system' || value === 'sensor' || value === 'light' || value === 'dark'
}

function readInitialTheme(): Theme {
	const stored = localStorage.get<string>(STORAGE_KEY)
	return isTheme(stored) ? stored : 'system'
}

export const themeStore = createStore<Theme>(readInitialTheme())

themeStore.on('change', ({ detail }) => {
	localStorage.set(STORAGE_KEY, detail.state)
})
