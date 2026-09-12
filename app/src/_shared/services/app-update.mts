/**
 * How often a running app asks whether a newer deployment has landed.
 *
 * Nothing here reloads anything: the worker is generated with
 * `skipWaiting`/`clientsClaim`, so a new version takes over as soon as it
 * installs, and the app shows it the next time the document loads — a
 * refresh, or a closed app opened again.
 *
 * What a running app does not do by itself is *find out*. The browser
 * re-checks the worker script on a document load and otherwise leaves it
 * alone, and an installed score pad is opened once and left running for a
 * game night. Without a check of its own, the new worker would not start
 * installing until the next launch, and installing is not showing — so the
 * refresh that should have brought the new version would come back on the
 * old one, and the version after it would be a launch behind for good.
 */
const updateIntervalMs = 60 * 60 * 1000

async function pollForUpdates(): Promise<void> {
	const registration = await navigator.serviceWorker.ready

	function checkForUpdate() {
		registration.update().catch((error) => {
			// Offline is the usual reason, and the next check will do.
			console.warn('[app-update] update check failed', error)
		})
	}

	setInterval(checkForUpdate, updateIntervalMs)
	// Coming back to a backgrounded app is the moment an update is most
	// likely to be waiting, and the moment it is cheapest to pick up: a
	// player who backgrounded the app is a player who may close it next.
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') checkForUpdate()
	})
	window.addEventListener('online', checkForUpdate)
}

// The worker itself is registered by the script vite-plugin-pwa injects into
// the page; `ready` waits for whatever that registration ends up being. In
// dev there is no worker and no registration, and this simply never resolves.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
	void pollForUpdates()
}
