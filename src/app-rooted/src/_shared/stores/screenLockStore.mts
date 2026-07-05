import { localStorage } from '@rooted/storage/web'
import { createStore } from '@rooted/store'

const STORAGE_KEY = 'keepScreenOn'

function readInitial(): boolean {
	return localStorage.get<boolean>(STORAGE_KEY) ?? true
}

/** User preference for whether to hold a screen wake-lock while the app is open. */
export const screenLockStore = createStore<boolean>(readInitial())

if (typeof window !== 'undefined') {
	screenLockStore.on('change', new AbortController().signal, ({ detail }) => {
		localStorage.set(STORAGE_KEY, detail.state)
	})
}
