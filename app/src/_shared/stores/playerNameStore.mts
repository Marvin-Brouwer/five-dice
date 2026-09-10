import { localStorage } from '@rooted/storage/web'
import { createStore } from '@rooted/store'

const STORAGE_KEY = 'playerName'

function readInitial(): string {
	return localStorage.get<string>(STORAGE_KEY) ?? ''
}

export const playerNameStore = createStore<string>(readInitial())

if (typeof window !== 'undefined') {
	playerNameStore.on('change', ({ detail }) => {
		if (detail.state) localStorage.set(STORAGE_KEY, detail.state)
		else localStorage.removeItem(STORAGE_KEY)
	})
}
