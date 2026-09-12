import { registerSW } from 'virtual:pwa-register'

import { newGameDisabledStore } from '../stores/gameStateStore.mts'

/**
 * How often a tab that stays open asks whether a newer deployment has landed.
 *
 * The browser checks the worker script by itself on navigation, and an
 * installed score pad does not navigate: it is opened once and left running
 * for the length of a game night. Without a timer, that session would never
 * hear about a new version at all.
 */
const updateIntervalMs = 60 * 60 * 1000

let reloadScheduled = false

/**
 * Swap the page over to the version the new worker is already serving.
 *
 * By the time this is called the new worker has activated and claimed the
 * page — it is built with `skipWaiting`/`clientsClaim` — so every request
 * from here on is answered out of the new precache. The chunks this page was
 * built against are no longer in it, which makes any not-yet-loaded route a
 * 404 waiting to happen. Reloading is what closes that window.
 *
 * The pad lives in memory only, so a reload mid-game throws a scorepad away.
 * That is the one thing worth waiting for: `newGameDisabledStore` is false
 * exactly while there is progress to lose, so a game in progress defers the
 * reload until the pad is empty again.
 */
function reloadWhenIdle(): void {
	if (reloadScheduled) return
	reloadScheduled = true

	if (newGameDisabledStore.value) {
		location.reload()
		return
	}

	newGameDisabledStore.on('change', ({ detail }) => {
		if (detail.state) location.reload()
	})
}

function pollForUpdates(swRegistration: ServiceWorkerRegistration | undefined): void {
	if (!swRegistration) return
	const registration = swRegistration

	function checkForUpdate() {
		registration.update().catch((error) => {
			// Offline is the usual reason, and the next check will do.
			console.warn('[app-update] update check failed', error)
		})
	}

	setInterval(checkForUpdate, updateIntervalMs)
	// Coming back to a backgrounded app is the moment an update is most
	// likely to be waiting, and the moment it is cheapest to take.
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') checkForUpdate()
	})
	window.addEventListener('online', checkForUpdate)
}

if (typeof window !== 'undefined') {
	registerSW({
		// Registration would otherwise wait for `load`; nothing here competes
		// with first paint, and registering early is what lets the first
		// update check happen on this visit rather than the next one.
		immediate: true,
		onNeedReload: reloadWhenIdle,
		onRegisteredSW(_scriptUrl, registration) {
			pollForUpdates(registration)
		},
		onRegisterError(error) {
			console.warn('[app-update] service worker registration failed', error)
		},
	})
}
