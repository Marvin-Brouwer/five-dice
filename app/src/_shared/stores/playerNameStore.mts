import { localStorage } from '@rooted/storage/web'
import { createStore } from '@rooted/store'

const STORAGE_KEY = 'playerName'

export const playerNameStore = createStore<string>(localStorage.get<string>(STORAGE_KEY) ?? '')

playerNameStore.on('change', ({ detail }) => {
	if (detail.state) localStorage.set(STORAGE_KEY, detail.state)
	else localStorage.removeItem(STORAGE_KEY)
})
