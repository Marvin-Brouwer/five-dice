import { localStorage } from '@rooted/storage/web'
import { createStore } from '@rooted/store'

export type Theme = 'system' | 'sensor' | 'light' | 'dark'

const STORAGE_KEY = 'theme'

function isTheme(value: string | undefined): value is Theme {
	return value === 'system' || value === 'sensor' || value === 'light' || value === 'dark'
}

export const themeStore = createStore.from<Theme>(() => {
	const stored = localStorage.get<string>(STORAGE_KEY)
	return isTheme(stored) ? stored : 'system'
})

themeStore.on('change', ({ detail }) => {
	localStorage.set(STORAGE_KEY, detail.state)
})
