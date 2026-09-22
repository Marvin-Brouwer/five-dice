import { expect, test } from '@playwright/test'

import { GamePage } from './game-page.mts'

/**
 * A die has to be bounded by itself, not by its stylesheet.
 *
 * `component()` injects a component's CSS as a `<link rel="stylesheet">` it
 * appends to `<head>` at module load, so that sheet is a fetch of its own and
 * always lands after the first paint. PipDie used to leave its sizing entirely
 * to that sheet -- a `viewBox`-only svg at `width: 100%` inside a span whose
 * box came from `.die` -- so until the fetch returned, the svg resolved against
 * the page instead and painted a die as wide as the viewport (#97). On a phone
 * that is the whole screen, for as long as the connection takes.
 *
 * Blocking the component sheets holds that moment still. It is deliberately
 * not a screenshot: the paper mesh is drawn per device, so a visual comparison
 * here would be flaky for reasons that have nothing to do with the die.
 */
test('the dice stay their own size before the component styles land', async ({ page }) => {
	const game = new GamePage(page)
	await game.withoutComponentStyles()

	await page.goto('en/score-card/')
	await expect(game.monogram).toBeAttached()

	// The viewport is 420px wide. Before the fix both of these measured the
	// full width of it; sized by the app bar they are 22px, and falling back to
	// the global 16px base -- which is all that is left with the component
	// sheets gone -- they are 16px.
	const monogram = await game.monogram.boundingBox()
	expect(monogram?.width, 'the app bar die should not grow past its text').toBeLessThan(64)

	const mastheadDie = await game.mastheadDie.boundingBox()
	expect(mastheadDie?.width, 'the masthead dice should not either').toBeLessThan(64)
})

/**
 * The backstop for the same failure, one level up: whatever the bar ends up
 * drawing, it cannot push the page down. This rule lives in index.global.css,
 * which index.html links, so unlike the component sheets it is there for the
 * first paint.
 */
test('the app bar stays a bar before the component styles land', async ({ page }) => {
	const game = new GamePage(page)
	await game.withoutComponentStyles()

	await page.goto('en/score-card/')
	await expect(game.monogram).toBeAttached()

	const bar = await page.locator('[r-component="app-bar"] header').boundingBox()
	expect(bar?.height, 'the unstyled bar should still be bar-sized').toBeLessThanOrEqual(64)
})
