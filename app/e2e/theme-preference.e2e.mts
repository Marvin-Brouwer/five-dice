import { expect, test } from '@playwright/test'

import { GamePage } from './game-page.mts'

/**
 * The chosen theme has to outlive the browser session.
 *
 * The cookie used to be written through `cookieStorage.set(name, value)`,
 * which leaves `Expires` off. A cookie without one is a session cookie: it
 * survives a reload, so this looked fine in a tab, and it is thrown away the
 * moment the last window closes. On a phone -- where the app is installed and
 * gets evicted rather than closed -- that is most of the time, and the menu
 * came back on "System" with the device deciding again.
 *
 * The reload below covers the round trip through the store. The expiry
 * assertion is the part that actually pins the bug, because a session cookie
 * reloads perfectly well.
 */
test('the chosen theme is remembered across sessions', async ({ page, context }) => {
	const game = new GamePage(page)
	await game.goto()

	await game.openMenu()
	await game.chooseTheme('Dark')
	expect(await game.resolvedTheme(), 'picking Dark should darken the page').toBe('dark')

	const [cookie] = (await context.cookies()).filter(c => c.name === 'theme')
	expect(cookie, 'the choice should be written to the theme cookie').toBeDefined()
	expect(cookie.value).toBe('dark')
	// Playwright reports a session cookie as -1, which is the regression.
	expect(cookie.expires, 'the theme cookie must not be a session cookie').toBeGreaterThan(0)
	expect(cookie.expires * 1000, 'the theme cookie should outlive the session by months')
		.toBeGreaterThan(Date.now() + 30 * 24 * 60 * 60 * 1000)

	await page.reload()
	await page.waitForSelector('#score-card [data-field]')
	expect(await game.resolvedTheme(), 'the page should still be dark after a reload').toBe('dark')

	await game.openMenu()
	await expect(game.themeTrigger, 'the menu should still show Dark').toHaveAccessibleName('Theme: Dark')
})
