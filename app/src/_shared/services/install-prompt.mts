import { createStore } from '@rooted/store'

/**
 * The deferred install prompt, where the browser offers one.
 *
 * Declared structurally rather than pulled from lib.dom, same as `wake-lock`
 * and `theme-sensor` do: `beforeinstallprompt` is a Chromium extension to the
 * platform, not a standard, and typing it locally keeps the feature check and
 * the type in one place.
 */
type InstallPromptEvent = Event & {
	prompt(): Promise<void>
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Whether an install prompt is available *right now*.
 *
 * A store rather than the `sensorAvailable()`-style predicate the theme
 * sensor exports, because `beforeinstallprompt` arrives asynchronously — some
 * time after first paint, and never at all on iOS Safari, which has no
 * install API. A synchronous predicate would answer `false` for every caller
 * that asked before the event landed.
 */
export const installAvailableStore = createStore<boolean>(false)

let deferredPrompt: InstallPromptEvent | undefined

/**
 * Show the browser's install prompt, if one was deferred.
 *
 * The event is single-use: once prompted it cannot be re-shown, so the store
 * goes false immediately rather than waiting on the user's choice. Chromium
 * fires a fresh `beforeinstallprompt` later if they dismissed it, which turns
 * the row back on by itself.
 */
export async function promptInstall(): Promise<void> {
	const prompt = deferredPrompt
	if (!prompt) return

	deferredPrompt = undefined
	installAvailableStore.update(() => false)

	try {
		await prompt.prompt()
		await prompt.userChoice
	}
	catch (error) {
		console.warn('[install-prompt] prompt failed', error)
	}
}

if (typeof window !== 'undefined') {
	window.addEventListener('beforeinstallprompt', (event) => {
		// Suppresses Chromium's own mini-infobar, which is the whole point of
		// deferring: the app offers the install from the doormat instead.
		event.preventDefault()
		deferredPrompt = event as InstallPromptEvent
		installAvailableStore.update(() => true)
	})

	window.addEventListener('appinstalled', () => {
		deferredPrompt = undefined
		installAvailableStore.update(() => false)
	})
}
