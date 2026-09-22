/**
 * @vitest-environment happy-dom
 * @vitest-environment-options { "settings": { "disableCSSFileLoading": true } }
 *
 * The module under test reaches straight for the splash in the document and
 * watches a live <main>, so it needs both. Scoped here so the rest of the
 * suite stays on plain node.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { dismissSplashWhenPageIsUp } from '../../src/_shared/services/splash.mts'

let lifetime: AbortController

const splash = () => document.querySelector('#splash')
const main = () => document.querySelector('#main-content')!

/** On its way out, or already out: the fade is short and the node then goes. */
const dismissed = () => splash() === null || splash()!.classList.contains('is-dismissed')

/** Mutation records are delivered in a microtask, so nothing is synchronous here. */
const settle = () => vi.waitFor(() => expect(dismissed()).toBe(true))

/** Watch the <main> that is in the document, the way application.mts does. */
const watch = () => dismissSplashWhenPageIsUp(main(), lifetime.signal)

beforeEach(() => {
	lifetime = new AbortController()
	// The transition stands in for index.splash.css, which a happy-dom document
	// has no way to load -- and the module reads the fade off the element, so
	// without one here the splash would leave without ever fading.
	document.body.innerHTML = '<div id="splash" style="transition-duration: 240ms"></div>'
		+ '<main id="main-content"></main>'
})

afterEach(() => {
	vi.useRealTimers()
	lifetime.abort()
	document.body.innerHTML = ''
})

describe('splash', () => {

	test('stays up over an empty page', async () => {
		watch()
		await new Promise(resolve => setTimeout(resolve, 20))

		expect(dismissed()).toBe(false)
	})

	test('stays up over the router host alone', async () => {
		// The router puts its host in straight away, well before it has a route
		// to put inside it. An element is not a page.
		watch()
		main().append(document.createElement('div'))
		await new Promise(resolve => setTimeout(resolve, 20))

		expect(dismissed()).toBe(false)
	})

	test('comes down once the page has something to read', async () => {
		watch()
		main().innerHTML = '<article><h1>Five dice</h1></article>'

		await settle()
	})

	test('comes down for a page that is all picture', async () => {
		watch()
		main().innerHTML = '<article><svg viewBox="0 0 1 1"></svg></article>'

		await settle()
	})

	test('outlasts a route that renders nothing on its way elsewhere', async () => {
		// What `/` does with a remembered locale: CultureSelect mounts, decides
		// it is in the wrong language and redirects, leaving an empty host
		// behind. Handing over there would hand over to nothing.
		watch()
		const host = document.createElement('div')
		main().append(host)
		await new Promise(resolve => setTimeout(resolve, 20))

		expect(dismissed()).toBe(false)

		host.innerHTML = '<h1>Five dice</h1>'

		await settle()
	})

	test('comes down without waiting when the page beat it to it', async () => {
		main().innerHTML = '<h1>Five dice</h1>'
		watch()

		expect(dismissed()).toBe(true)
	})

	test('leaves the document rather than sitting there invisible', async () => {
		watch()
		main().innerHTML = '<h1>Five dice</h1>'

		await vi.waitFor(() => expect(splash()).toBeNull())
		expect(main()).not.toBeNull()
	})

	test('waits out the fade the stylesheet asks for, not one of its own', async () => {
		// index.splash.css is the one place the timing is written down, so the
		// backstop reads it. Here that is an inline style, which computes the
		// same way -- there is no sheet in a happy-dom document.
		splash()!.setAttribute('style', 'transition-duration: 500ms')
		vi.useFakeTimers()
		watch()
		main().innerHTML = '<h1>Five dice</h1>'

		await vi.advanceTimersByTimeAsync(500)
		expect(splash(), 'gone before the fade had finished').not.toBeNull()

		await vi.advanceTimersByTimeAsync(500)
		expect(splash()).toBeNull()
	})

	test('is not a fault in a document that never had one', () => {
		splash()!.remove()
		main().innerHTML = '<h1>Five dice</h1>'

		expect(() => watch()).not.toThrow()
	})

})
