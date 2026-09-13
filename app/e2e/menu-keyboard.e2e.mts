import { expect, test } from '@playwright/test'

import { GamePage } from './game-page.mts'

/**
 * Both menu dropdowns have to be operable without a pointer.
 *
 * They announce themselves as a listbox, and for a long time that was all
 * they did: the options were `div[role=option]` that Tab skipped straight
 * past, with nothing listening for an arrow key. Someone on a keyboard could
 * open the list, read it, and then not choose anything.
 *
 * That is worst for the language chooser, which is *how* you change the app's
 * language, so the last test here switches locale end to end rather than only
 * checking that a key moved a highlight.
 *
 * Focus stays on the listbox and the active option is named by
 * `aria-activedescendant`, so `activeOption()` — not `toBeFocused()` — is
 * what says where the keyboard is.
 */

/**
 * The Theme list's "Sensor" row is disabled when the browser has no ambient
 * light sensor, which is what the skipping test needs it to be. Chromium ships
 * without one, but only behind a flag that a future release could flip, so it
 * is taken away here rather than assumed.
 */
test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		delete (window as { AmbientLightSensor?: unknown }).AmbientLightSensor
	})
})

test('the theme chooser can be driven with the keyboard alone', async ({ page }) => {
	const game = new GamePage(page)
	await game.goto()
	await game.openMenu()

	await game.themeTrigger.press('Enter')
	await expect(game.themeTrigger, 'Enter should open the list').toHaveAttribute('aria-expanded', 'true')
	await expect(game.listbox, 'the list should take focus, so the arrows reach it').toBeFocused()
	expect(await game.activeOption(), 'the list should open on the current choice').toBe('System')

	await page.keyboard.press('ArrowDown')
	await page.keyboard.press('ArrowDown')
	expect(await game.activeOption(), 'the arrows should walk down the list').toBe('Dark')

	await page.keyboard.press('Enter')
	await expect(game.themeTrigger, 'Enter should choose the active option').toHaveAccessibleName('Theme: Dark')
	await expect(game.listbox, 'choosing should close the list').toBeHidden()
	await expect(game.themeTrigger, 'and hand focus back, not drop it').toBeFocused()
	expect(await game.resolvedTheme(), 'and the choice should actually apply').toBe('dark')
})

test('the arrows stop at the ends, and Home and End jump to them', async ({ page }) => {
	const game = new GamePage(page)
	await game.goto()
	await game.openMenu()

	await game.themeTrigger.press('Enter')

	await page.keyboard.press('End')
	expect(await game.activeOption(), 'End should jump to the last option').toBe('Dark')
	await page.keyboard.press('ArrowDown')
	expect(await game.activeOption(), 'and the list should not wrap around past it').toBe('Dark')

	await page.keyboard.press('Home')
	expect(await game.activeOption(), 'Home should jump to the first option').toBe('System')
	await page.keyboard.press('ArrowUp')
	expect(await game.activeOption(), 'and the list should not wrap around past it either').toBe('System')
})

test('an option that cannot be chosen is skipped', async ({ page }) => {
	const game = new GamePage(page)
	await game.goto()
	await game.openMenu()

	await game.themeTrigger.press('Enter')
	await expect(
		page.getByRole('option', { name: /^Sensor/ }),
		'this browser has no light sensor, so that row should be disabled',
	).toHaveAttribute('aria-disabled', 'true')

	await page.keyboard.press('ArrowDown')
	expect(await game.activeOption(), 'the arrow should step over the disabled row').toBe('Light')
	await page.keyboard.press('ArrowUp')
	expect(await game.activeOption(), 'and step back over it on the way up').toBe('System')
})

test('Escape closes the list and leaves the menu standing', async ({ page }) => {
	const game = new GamePage(page)
	await game.goto()
	await game.openMenu()

	await game.themeTrigger.press('Enter')
	await page.keyboard.press('Escape')

	await expect(game.listbox, 'Escape should close the list').toBeHidden()
	await expect(game.themeTrigger, 'and put focus back on the trigger').toBeFocused()
	// The menu is a modal <dialog>, so Escape reaches it as the keydown's
	// default action. Without a preventDefault the whole sheet goes with the
	// list, which is what this asserts against.
	await expect(game.menuSheet, 'but not take the menu with it').toBeVisible()

	await page.keyboard.press('Escape')
	await expect(game.menuSheet, 'a second Escape is what closes the menu').toBeHidden()
})

test('typing the start of an option jumps to it', async ({ page }) => {
	const game = new GamePage(page)
	await game.goto()
	await game.openMenu()

	await game.themeTrigger.press('Enter')

	await page.keyboard.press('d')
	expect(await game.activeOption(), 'typing a letter should jump to the option it starts').toBe('Dark')

	// Keys struck close together build one search string, the way a listbox
	// is meant to -- so this waits that buffer out rather than looking for an
	// option called "dl".
	await page.waitForTimeout(600)
	await page.keyboard.press('l')
	expect(await game.activeOption(), 'and again once the search has lapsed').toBe('Light')
})

test('tabbing out of an open list closes it', async ({ page }) => {
	const game = new GamePage(page)
	await game.goto()
	await game.openMenu()

	await game.themeTrigger.press('Enter')
	await page.keyboard.press('Tab')

	await expect(game.listbox, 'Tab should leave the list, and close it behind').toBeHidden()
	await expect(game.themeTrigger, 'which the trigger has to reflect').toHaveAttribute('aria-expanded', 'false')
})

test('the language chooser switches locale from the keyboard', async ({ page }) => {
	const game = new GamePage(page)
	await game.goto()
	await game.openMenu()

	// The arrows open a closed list too, landing on its first option.
	await game.languageTrigger.press('ArrowDown')
	expect(await game.activeOption(), 'ArrowDown should open on the first option').toBe('English')

	await page.keyboard.press('ArrowDown')
	expect(await game.activeOption(), 'and walk on to the next').toBe('Nederlands')

	await page.keyboard.press('Enter')
	await expect(page, 'choosing a language should navigate to it').toHaveURL(/\/nl\/score-card\//)
	await expect(
		game.languageTrigger,
		'and the chooser should come back naming the new one',
	).toHaveAccessibleName('Taal: Nederlands')
	// The switch rebuilds the whole menu body, trigger included. Focus has to
	// land on the replacement, or it drops to the top of the sheet.
	await expect(game.languageTrigger, 'without losing the keyboard user their place').toBeFocused()
})
