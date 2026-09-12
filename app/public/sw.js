/**
 * Tombstone for the service worker of the Astro app this one replaced.
 *
 * That app registered `/five-dice/sw.js`; this one registers
 * `/five-dice/worker.js`. A browser with the old app installed still asks for
 * the old script by name, and every one of those asks has been answered with
 * the 404 page since the rewrite shipped -- so the old worker stayed
 * installed, kept serving its own precache, and the app it serves can never
 * reach the new `index.html` that would register the new worker. This file is
 * what those installs fetch instead: a worker whose only job is to clear the
 * way for its replacement.
 *
 * It is deliberately plain JavaScript in `public/`, because it has to land at
 * that exact URL, and nothing in the app ever registers it. Deleting it
 * re-breaks every install that has not been picked up yet.
 */

self.addEventListener('install', () => {
	// No waiting room: the worker being replaced is the problem.
	self.skipWaiting()
})

self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		// Only this app's caches. The origin is shared with every other
		// project page on github.io, and workbox suffixes its cache names
		// with the scope, which is what makes ours identifiable.
		const cacheNames = await caches.keys()
		await Promise.all(cacheNames
			.filter(cacheName => cacheName.includes(self.registration.scope))
			.map(cacheName => caches.delete(cacheName)))

		await self.registration.unregister()

		// The open window is still running the old app off the cache that was
		// just deleted, so it gets sent back to the network -- where the new
		// app, and its own worker registration, are waiting.
		const clients = await self.clients.matchAll({
			type: 'window',
		})
		for (const client of clients) {
			if ('navigate' in client) client.navigate(client.url)
		}
	})())
})
