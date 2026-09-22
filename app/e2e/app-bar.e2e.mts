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

/**
 * A native control is painted by the UA, and `:root` pins `color-scheme: dark`
 * so that the scrollbars and an installed app's chrome come up dark. That
 * makes an unstyled button dark grey with a white glyph -- the exact inverse
 * of the kebab the app bar draws, which is dark ink on the cardboard page. It
 * read as the icon flashing inverted on every refresh.
 *
 * `.kebab` cannot fix it: app-bar.css is one of the sheets that arrives late.
 * The reset in index.global.css can, because index.html links it.
 */
test('the menu icon is not painted by the browser before the styles land', async ({ page }) => {
	const game = new GamePage(page)
	await game.withoutComponentStyles()

	await page.goto('en/score-card/')
	await expect(game.kebab).toBeAttached()

	const painted = await game.kebab.evaluate(el => {
		const style = getComputedStyle(el)
		return {
			background: style.backgroundColor,
			color: style.color,
			ink: getComputedStyle(document.body).color,
		}
	})

	expect(painted.background, 'the button should not paint a surface of its own').toBe('rgba(0, 0, 0, 0)')
	expect(painted.color, 'the glyph should follow the page ink, not the UA').toBe(painted.ink)
})

/**
 * The bar's contents should not walk across it once app-bar.css lands.
 *
 * With nothing laying the <header> out, it was a block: the wordmark took a
 * line of its own and the kebab sat wherever that left it, 310px from where
 * it ends up. index.global.css carries the box the two of them lay out in --
 * a flex row, split, with the page padding -- so they start in roughly their
 * final places. Only roughly: their sizes and typography still come from
 * app-bar.css, which is why this measures arrangement rather than position.
 */
test('the bar is laid out before the component styles land', async ({ page }) => {
	const game = new GamePage(page)
	await game.withoutComponentStyles()

	await page.goto('en/score-card/')
	await expect(game.kebab).toBeAttached()

	const bar = (await page.locator('[r-component="app-bar"] header').boundingBox())!
	const kebab = (await game.kebab.boundingBox())!
	const die = (await game.monogram.boundingBox())!

	expect(kebab.x, 'the kebab should start on the right of the bar').toBeGreaterThan(bar.x + bar.width / 2)
	expect(die.x, 'the die should start against the left of the bar').toBeLessThan(bar.x + 24)

	// Both on one row, centred on it -- not stacked, which is what a block
	// <header> did with them.
	const centre = (box: { y: number, height: number }) => box.y + box.height / 2
	expect(
		Math.abs(centre(kebab) - centre(die)),
		'the die and the kebab should sit on the same line',
	).toBeLessThan(4)
})
