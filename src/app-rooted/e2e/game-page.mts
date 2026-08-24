import { expect, type Locator, type Page } from '@playwright/test'

import type { DiceTuple, ScoreField } from '../src/game/_logic/gameConstants.ts'

import { installCelebrationSpy, type CelebrationSpy } from './celebration-spy.mts'

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
		await this.page.addInitScript(installCelebrationSpy)
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

	celebration(): Promise<CelebrationSpy> {
		return this.page.evaluate(() => window.__celebration)
	}

	/**
	 * Block until the confetti has finished animating.
	 *
	 * A burst runs for several seconds, so without this a test finishes while
	 * it is still going — which truncates the recorded video and, worse, makes
	 * the frame count useless to anything measuring afterwards.
	 */
	async waitForCelebrationToEnd(timeout = 20_000) {
		const settleFor = 3
		const interval = 250
		let previous = -1
		let stable = 0

		for (let elapsed = 0; elapsed < timeout; elapsed += interval) {
			await this.page.waitForTimeout(interval)
			const { rafCalls } = await this.celebration()
			stable = rafCalls === previous ? stable + 1 : 0
			previous = rafCalls
			if (stable >= settleFor) return
		}
		throw new Error(`Confetti was still animating after ${timeout}ms`)
	}

	/** The round counter has turned into the party icon and the sticker has gone. */
	async expectFinished() {
		await expect(this.page.locator('#score-card .round-label-finished')).toBeVisible()
		await expect(this.page.getByText('Game finished', { exact: true })).toBeAttached()
		await expect(this.sticker).toBeHidden()
	}

	/**
	 * The confetti ran and the fanfare made a sound.
	 *
	 * Call after `waitForCelebrationToEnd`, so the frame count is final.
	 */
	async expectCelebrated() {
		const spy = await this.celebration()

		expect(spy.rafCalls, 'the confetti should have animated').toBeGreaterThan(30)
		expect(spy.decodeAttempts, 'the fanfare should have been loaded').toBeGreaterThan(0)
		expect(
			spy.soundsStarted,
			spy.decodeFailures > 0
				// The pointer stubs decode to nothing, so this is the failure
				// people hit on a fresh clone without LFS. Say so, rather than
				// leaving them to find it in a console warning.
				? `the fanfare failed to decode (${spy.decodeFailures} of ${spy.decodeAttempts} sounds). `
					+ 'The audio assets are probably Git LFS pointer stubs — run `git lfs pull`.'
				: 'the fanfare should have played',
		).toBeGreaterThan(0)
	}

	async expectInProgress() {
		await expect(this.page.locator('aside[role="status"]')).toBeHidden()
		await expect(this.sticker).toBeVisible()
	}
}
