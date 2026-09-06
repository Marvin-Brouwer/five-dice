import { expect, test } from '@playwright/test'

import { GamePage } from './game-page.mts'

/**
 * The picked row previews what it would become, on a tap as well as on a
 * hover.
 *
 * The preview used to hang off hover and focus alone, which held up under a
 * mouse and fell over under a finger: Safari does not focus a radio when its
 * label is tapped, so the first tap in a picker blurred the radio the dialog
 * had autofocused and nothing put the preview back. The row read as empty --
 * a bare `.` where its dice belong -- until the next tap. Chromium focuses
 * the radio, so `dropHoverAndFocus` is what stands in for the iPhone here.
 */
test('a picked row keeps its preview without hover or focus', async ({ page }) => {
	const game = new GamePage(page)
	await game.goto()

	await game.openRowPicker([6, 6, 5, 5, 4])
	await game.select('chance')
	await game.dropHoverAndFocus()

	const previewed = await game.row('chance')
	expect(previewed.dice, 'the picked row should preview all five dice').toBe(5)
	expect(previewed.score, 'the picked row should preview its score').toBe('26')

	// And the preview is the same thing the row becomes.
	await game.confirmSelection()
	await expect(page.locator('dialog.layer[open]')).toHaveCount(0)
	expect(await game.row('chance')).toMatchObject({ dice: 5, score: '26' })
})
