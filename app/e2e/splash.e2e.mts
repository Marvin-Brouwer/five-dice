import { expect, test } from '@playwright/test'

import { GamePage } from './game-page.mts'
import { installSplashSpy } from './splash-spy.mts'

/**
 * What the app shows while it is still arriving.
 *
 * Nothing this app draws is in index.html: the shell waits on the entry
 * module, the module waits on the dictionary, and the route waits on a chunk
 * of its own. Installed, that read as the launcher handing its icon over to an
 * empty page and back again (#98). The splash is the one thing that can cover
 * it, because it is markup index.html carries rather than a component -- and
 * this spec is about both ends of that: it is there before the app is, and it
 * leaves on the beat the app is ready, not before.
 */

/**
 * The start of the gap, held still by refusing to serve the entry module. The
 * same trick as `withoutComponentStyles` in app-bar.e2e.mts, a stage earlier.
 */
test('the splash is on screen before the app is', async ({ page }) => {
	const game = new GamePage(page)
	await game.withoutTheApp()

	await page.goto('en/score-card/')
	await expect(game.splash).toBeVisible()

	// Nothing of the app has mounted -- which is the state being pinned.
	await expect(page.locator('[r-component="app-bar"]')).toHaveCount(0)

	// And it says nothing: scripting is on, so an app is still coming. The
	// line below is for the case where one never will be.
	await expect(game.splashMessage).toHaveCount(0)

	// The viewport is 420x1000. The splash is all the player has, so it had
	// better be all of it.
	const viewport = page.viewportSize()!
	const box = (await game.splash.boundingBox())!
	expect(box.width, 'the splash should cover the page').toBe(viewport.width)
	expect(box.height, 'the splash should cover the page').toBe(viewport.height)

	// The same failure the app bar's dice had: an inline svg with no size of
	// its own resolves against the page. The die carries width and height as
	// attributes so it cannot, whatever else is missing (#97).
	const die = (await game.splashDie.boundingBox())!
	expect(die.width, 'the die should be a die, not the whole screen').toBeLessThan(128)
	expect(
		Math.abs((die.x + die.width / 2) - (box.x + box.width / 2)),
		'and it should be in the middle of it',
	).toBeLessThan(2)
})

/** The other end: the app arrives, and the splash leaves the document. */
test('the splash is gone once the score card is up', async ({ page }) => {
	const game = new GamePage(page)

	await game.goto()

	await expect(game.splash).toHaveCount(0)
})

/**
 * And it leaves onto a page rather than onto nothing.
 *
 * The obvious signal -- the router announcing the end of a navigation -- is
 * the wrong one, and quietly: the router renders inside a view transition and
 * does not wait for it, so `end` arrives while <main> is still empty. This is
 * the regression guard for that, since the end state looks identical either
 * way and only the moment of hand-over tells them apart.
 */
test('the splash hands over to a page, not to an empty one', async ({ page }) => {
	await page.addInitScript(installSplashSpy)

	const game = new GamePage(page)
	await game.goto()
	await expect(game.splash).toHaveCount(0)

	const spy = await page.evaluate(() => window.__splash)
	expect(spy.pageAtHandover, 'the splash should have waited for a page').toBeTruthy()
})

/**
 * `/` is the hardest case: CultureSelect answers a remembered locale by
 * redirecting from its own mount, so the first route renders nothing at all
 * and the page the player asked for is a second navigation and another chunk
 * away. The splash has to hold across the whole of it.
 */
test('the splash holds across the redirect off the language picker', async ({ page }) => {
	const game = new GamePage(page)

	// Remember a locale the way a player does: by having been here in it.
	await page.goto('en/')
	await expect(page.getByRole('heading', { name: 'Five dice' }).first()).toBeVisible()

	await page.addInitScript(installSplashSpy)
	await page.goto('')
	await expect(page).toHaveURL(/\/en\/$/)
	await expect(game.splash).toHaveCount(0)

	const spy = await page.evaluate(() => window.__splash)
	expect(
		spy.pageAtHandover,
		'the splash should have held until the redirect landed somewhere',
	).toBeTruthy()
})

/**
 * The one case nothing can take the splash down in.
 *
 * With scripting off there is no app coming, so the splash stops being a wait
 * and becomes the page: the die holds still, and a line under it says why. A
 * die tossing forever over a page that is never going to load says nothing at
 * all, which is worse than the bare page.
 *
 * The rules that do it live in a <noscript> block in index.html, qualified by
 * `html` so they outrank index.global.css -- which this spec cannot see, since
 * the suite runs against the dev server, where the sheets are linked in source
 * order and the block would win on position anyway. It is the build that
 * reorders them. So what this pins is that the block is there and does its
 * job; the specificity is pinned by the comment beside it.
 */
test.describe('without scripting', () => {
	test.use({
		javaScriptEnabled: false,
	})

	test('the splash says why nothing is coming', async ({ page }) => {
		const game = new GamePage(page)

		await page.goto('en/score-card/')

		// Said once, though every language is in the markup: the page cannot
		// pick one without the app, so <html lang>, which the build writes per
		// locale, is all there is to go on.
		await expect(game.splashMessage).toHaveCount(1)
		await expect(game.splashMessage).toHaveText('Five dice needs JavaScript to keep score.')
		await expect(game.splash).toBeVisible()

		// The die is still there, and still: there is nothing left to wait for.
		const animation = await game.splashDie.evaluate(die => getComputedStyle(die).animationName)
		expect(animation, 'the toss should be off').toBe('none')
	})

	test('and says it in the language of the page it is on', async ({ page }) => {
		const game = new GamePage(page)
		await game.servedAsLocale('nl')

		await page.goto('nl/')

		await expect(game.splashMessage).toHaveCount(1)
		await expect(game.splashMessage).toHaveText('Five dice heeft JavaScript nodig om de score bij te houden.')
	})
})

/** And with no locale remembered, it hands over to the language picker. */
test('the splash hands over to the language picker', async ({ page }) => {
	const game = new GamePage(page)

	await page.goto('')

	await expect(page.getByRole('heading', { name: 'Choose your language' })).toBeVisible()
	await expect(game.splash).toHaveCount(0)
})
