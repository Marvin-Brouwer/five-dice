import { expect, type Locator, type Page } from '@playwright/test'

import type { DiceTuple, ScoreField } from '../src/game/_logic/gameConstants.ts'

export type RowState = {
	/** The score cell's text: a number, '.' when empty, '' when discarded. */
	score: string
	/** The `+N` flush badge, or null when there isn't one. */
	badge: string | null
	/** How many dice faces the roll cell shows. */
	dice: number
	discarded: boolean
}

export type Totals = {
	partOne: string
	bonus: string
	partTwo: string
	final: string
}

/**
 * The whole game, driven the way a player drives it.
 *
 * Every selector in the e2e suite lives here, so a renamed class is one edit
 * rather than one per spec.
 */
export class GamePage {

	constructor(private readonly page: Page) {}

	async goto(locale = 'en') {
		await this.page.goto(`${locale}/score-card/`)
		await this.page.waitForSelector('#score-card [data-field]')
		await expect(this.sticker).toBeVisible()
	}

	private get sticker(): Locator {
		return this.page.locator('#score-card button.sticker')
	}

	private get keypadConfirm(): Locator {
		return this.page.locator('dialog button.action-primary')
	}

	private get openOverlay(): Locator {
		return this.page.locator('section[role="dialog"]:not([hidden])')
	}

	private rowLocator(field: ScoreField): Locator {
		return this.page.locator(`#score-card tr[data-field="${field}"]`)
	}

	/**
	 * One full round: open the keypad, type the roll, pick a row — and, when
	 * the roll is a second or later flush, pick the row to sacrifice for it.
	 */
	async enterRoll(dice: DiceTuple, field: ScoreField, sacrifice?: ScoreField) {
		await this.sticker.click()
		await expect(this.keypadConfirm).toBeVisible()

		for (const die of dice) await this.page.keyboard.press(String(die))
		await expect(this.keypadConfirm).toBeEnabled()
		await this.keypadConfirm.click()

		await this.pick(field)

		if (sacrifice !== undefined) {
			// The flush-discard step only appears for a stacking flush.
			await this.pick(sacrifice)
		}
		await expect(this.openOverlay).toHaveCount(0)
	}

	/** Choose a row in whichever picker is currently open. */
	private async pick(field: ScoreField) {
		const overlay = this.openOverlay
		await expect(overlay).toBeVisible()
		await overlay.locator(`label[data-field="${field}"]`).click()
		const confirm = overlay.locator('button.action-primary')
		await expect(confirm).toBeEnabled()
		await confirm.click()
	}

	async row(field: ScoreField): Promise<RowState> {
		return this.rowLocator(field).evaluate(row => ({
			score: row.querySelector('td.score-column')?.textContent?.trim() ?? '',
			badge: row.querySelector('.roll-badge')?.textContent?.trim() ?? null,
			dice: row.querySelectorAll('td.roll-column svg').length,
			discarded: row.className.includes('discarded'),
		}))
	}

	/**
	 * The four totals rows, read by position. They carry no per-row hook; if
	 * that turns out to be brittle, add a `data-total` attribute in
	 * totals-table.mts rather than a cleverer selector here.
	 */
	async totals(): Promise<Totals> {
		const [partOne, bonus, partTwo, final] = await this.page
			.locator('#score-card table')
			.last()
			.locator('tbody tr td.totals-column')
			.allInnerTexts()

		return {
			partOne: partOne?.trim() ?? '',
			bonus: bonus?.trim() ?? '',
			partTwo: partTwo?.trim() ?? '',
			final: final?.trim() ?? '',
		}
	}

	/** The end-of-game banner is shown and the sticker has gone. */
	async expectFinished() {
		await expect(this.page.locator('aside[role="status"]')).toBeVisible()
		await expect(this.sticker).toBeHidden()
	}

	async expectInProgress() {
		await expect(this.page.locator('aside[role="status"]')).toBeHidden()
		await expect(this.sticker).toBeVisible()
	}
}
