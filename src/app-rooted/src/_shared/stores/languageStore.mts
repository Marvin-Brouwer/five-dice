import { cookieStorage } from '@rooted/storage/web'
import { createStore } from '@rooted/store'

export type Language = 'en'

export const availableLanguages: Language[] = ['en']

const COOKIE_NAME = 'language'

function readInitialLanguage(): Language {
	const stored = cookieStorage.get<string>(COOKIE_NAME)
	if (stored && (availableLanguages as string[]).includes(stored)) return stored as Language
	return 'en'
}

export const languageStore = createStore<Language>(readInitialLanguage())

if (typeof document !== 'undefined') {
	document.documentElement.lang = languageStore.value
	languageStore.on('change', new AbortController().signal, ({ detail }) => {
		document.documentElement.lang = detail.state
		cookieStorage.set(COOKIE_NAME, detail.state)
	})
}
