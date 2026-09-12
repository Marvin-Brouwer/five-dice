import { expect, test } from '@playwright/test'

import { GamePage } from './game-page.mts'

/**
 * The chosen theme has to outlive the browser session.
 *
 * It used to be kept in a cookie written without an `Expires`, which makes it
 * a session cookie: it survives a reload, so this looked fine in a tab, and
 * the browser throws it away the moment the last window closes. On a phone —
 * where the installed app is evicted rather than closed — that is most of the
 * time, and the menu came back on "System" with the device deciding again.
 *
 * A reload cannot catch that on its own, so the stored value is asserted
 * directly. `localStorage` has no expiry to get wrong, which is the point of
 * keeping it there rather than in a cookie.
 */
test('the chosen theme is remembered across sessions', async ({ page, context }) => {
	const game = new GamePage(page)
	await game.goto()

	await game.openMenu()
	await game.chooseTheme('Dark')
	expect(await game.resolvedTheme(), 'picking Dark should darken the page').toBe('dark')

	expect(await game.storedTheme(), 'the choice should be written to localStorage').toBe('dark')
	expect(
		(await context.cookies()).map(c => c.name),
		'the theme should not be kept in a cookie, which the session would take with it',
	).not.toContain('theme')

	await page.reload()
	await page.waitForSelector('#score-card [data-field]')
	expect(await game.resolvedTheme(), 'the page should still be dark after a reload').toBe('dark')

	await game.openMenu()
	await expect(game.themeTrigger, 'the menu should still show Dark').toHaveAccessibleName('Theme: Dark')
})
