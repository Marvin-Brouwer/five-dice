import { expect, type Locator, type Page } from '@playwright/test'

import type { DiceTuple, ScoreField } from '../src/game/logic/gameConstants.ts'

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

	/**
	 * Scoped to the keypad's own dialog. Every picker is a `<dialog>` too, so
	 * a bare `dialog button.action-primary` matches all three primaries.
	 */
	private get keypadConfirm(): Locator {
		return this.page.locator('dialog.sheet-keypad button.action-primary')
	}

	/** The row picker and the flush picker are full-viewport modal dialogs. */
	private get openOverlay(): Locator {
		return this.page.locator('dialog.layer[open]')
	}

	private rowLocator(field: ScoreField): Locator {
		return this.page.locator(`#score-card tr[data-field="${field}"]`)
	}

	/**
	 * One full round: open the keypad, type the roll, pick a row — and, when
	 * the roll is a second or later flush, pick the row to sacrifice for it.
	 */
	async enterRoll(dice: DiceTuple, field: ScoreField, sacrifice?: ScoreField) {
		await this.openRowPicker(dice)

		await this.pick(field)

		if (sacrifice !== undefined) {
			// The flush-discard step only appears for a stacking flush.
			await this.pick(sacrifice)
		}
		await expect(this.openOverlay).toHaveCount(0)
	}

	/** Open the keypad, key in a roll, and stop with the row picker showing. */
	async openRowPicker(dice: DiceTuple) {
		await this.sticker.click()
		await expect(this.keypadConfirm).toBeVisible()

		for (const die of dice) await this.page.keyboard.press(String(die))
		await expect(this.keypadConfirm).toBeEnabled()
		await this.keypadConfirm.click()
		await expect(this.openOverlay).toBeVisible()
	}

	/** Check a row in the open picker, leaving it unconfirmed. */
	async select(field: ScoreField) {
		const overlay = this.openOverlay
		await expect(overlay).toBeVisible()
		await overlay.locator(`label[data-field="${field}"]`).click()
	}

	/**
	 * The value of the checked radio in the open picker: a row's field, or ''
	 * for the invisible "nothing picked yet" placeholder.
	 */
	async checkedOption(): Promise<string | undefined> {
		return this.openOverlay.locator('input[type="radio"]:checked').evaluate(radio => (radio as HTMLInputElement).value)
	}

	/** The picker's placeholder option, which stands for "nothing picked yet". */
	get placeholderOption(): Locator {
		return this.openOverlay.locator('input[type="radio"][value=""]')
	}

	/** The rows the open picker is currently previewing or highlighting. */
	get previewedRows(): Locator {
		return this.page.locator('#score-card [data-field][data-hover="true"]')
	}

	/** The open picker's confirm button. */
	get pickerConfirm(): Locator {
		return this.openOverlay.locator('button.action-primary')
	}

	/**
	 * Take hover and focus off the picker, leaving only the checked row —
	 * which is all Safari leaves behind after a tap, since it does not focus
	 * a radio when its label is tapped.
	 */
	async dropHoverAndFocus() {
		await this.page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
		await this.page.mouse.move(0, 0)
	}

	/** Commit whatever is checked in the open picker. */
	async confirmSelection() {
		const confirm = this.openOverlay.locator('button.action-primary')
		await expect(confirm).toBeEnabled()
		await confirm.click()
	}

	/** Choose a row in whichever picker is currently open. */
	private async pick(field: ScoreField) {
		await this.select(field)
		await this.confirmSelection()
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

	// --- The cold start -----------------------------------------------------

	/**
	 * The splash index.html paints while the app loads. Not a component, so it
	 * has no `r-component` to go by.
	 */
	get splash(): Locator {
		return this.page.locator('#splash')
	}

	/** The die tossing on the splash. */
	get splashDie(): Locator {
		return this.page.locator('#splash svg')
	}

	/**
	 * The line the splash says when there is no app coming.
	 *
	 * Every language the app has is in the markup and CSS picks the one that
	 * matches `<html lang>`, so this is scoped to what is actually showing:
	 * no match at all is the answer whenever an app *is* coming.
	 */
	get splashMessage(): Locator {
		return this.page.locator('#splash .splash-message:visible')
	}

	/**
	 * Serve nothing for the entry module, so the page stays on whatever
	 * index.html and the sheets it links can draw by themselves.
	 *
	 * The real thing is the gap before that module has been fetched, parsed and
	 * run -- plus the dictionary and the route chunk it goes on to ask for.
	 * Aborting it holds the start of that gap still.
	 */
	async withoutTheApp() {
		await this.page.route('**/application.mts*', route => route.abort())
	}

	/**
	 * Hold the score card's own chunk back, so the splash stays up with the
	 * rest of the app already running behind it.
	 *
	 * `withoutTheApp` is the other half of this: that one stops the boot
	 * entirely, which is the right state for anything index.html has to get
	 * right by itself. This one is for what the app does *to* the splash while
	 * it is still up.
	 */
	async withoutTheFirstPage() {
		await this.page.route('**\/game.mts*', async (route) => {
			await new Promise(resolve => setTimeout(resolve, 10_000))
			await route.continue()
		})
	}

	/**
	 * Pinch-zoom the page, the way a player does on a phone.
	 *
	 * There is no input for this in Playwright -- a real pinch is two touch
	 * points the renderer turns into a page scale -- so it is set through the
	 * devtools protocol, which is where the browser keeps it.
	 */
	async pinchZoomTo(scale: number) {
		const cdp = await this.page.context().newCDPSession(this.page)
		await cdp.send('Emulation.setPageScaleFactor', {
			pageScaleFactor: scale,
		})
	}

	/** Where the die is, and where the middle of the screen is, both in what the player sees. */
	async splashDieAgainstTheScreen(): Promise<{ die: [number, number], centre: [number, number] }> {
		return this.page.evaluate(() => {
			const box = document.querySelector('#splash svg')!.getBoundingClientRect()
			const viewport = window.visualViewport!
			return {
				die: [
					(box.x + box.width / 2 - viewport.offsetLeft) * viewport.scale,
					(box.y + box.height / 2 - viewport.offsetTop) * viewport.scale,
				],
				centre: [
					viewport.width * viewport.scale / 2,
					viewport.height * viewport.scale / 2,
				],
			}
		})
	}

	/**
	 * Serve nothing for the splash's own stylesheet.
	 *
	 * The splash is the one thing on the page with no second chance: whatever
	 * the first frame puts on screen is what the player sees on every cold
	 * start. A sheet is a fetch, so this is the state where it has not landed
	 * yet -- or never does, 404 behind a stale worker cache.
	 */
	async withoutTheSplashStyles() {
		await this.page.route('**\/index.splash.css*', route => route.abort())
	}

	/**
	 * Serve the document declaring the locale it would declare once built.
	 *
	 * The dev server hands the same index.html to every path; it is the build
	 * that writes `<html lang>` per locale, into a copy of the file per locale.
	 * Anything that reads that attribute is therefore untestable here without
	 * putting it back, which is all this does.
	 */
	async servedAsLocale(locale: string) {
		await this.page.route('**\/*/', async (route) => {
			const response = await route.fetch()
			const body = await response.text()
			if (!body.includes('<html lang=')) return route.fulfill({ response })

			await route.fulfill({
				response,
				body: body.replace('<html lang="en">', `<html lang="${locale}">`),
			})
		})
	}

	// --- The app bar --------------------------------------------------------

	/**
	 * Serve nothing for the component stylesheets, so the page renders with only
	 * the globals index.html links.
	 *
	 * That is not a contrived state: `component()` injects its CSS as a
	 * `<link rel="stylesheet">` appended to `<head>` at module load, so every
	 * component stylesheet is a separate fetch that lands after the first paint.
	 * Blocking them is the same condition a cold load on a slow connection puts
	 * the app in, held still.
	 */
	async withoutComponentStyles() {
		await this.page.route('**/@rooted-css/**', route => route.abort())
	}

	/** The die beside the wordmark in the app bar. */
	get monogram(): Locator {
		return this.page.locator('[r-component="app-bar"] svg').first()
	}

	/** The first of the five dice tossed on the masthead band. */
	get mastheadDie(): Locator {
		return this.page.locator('[r-component="masthead"] svg').first()
	}

	/** The app bar's kebab, which opens the menu. */
	get kebab(): Locator {
		return this.page.locator('[r-component="app-bar"] button')
	}

	// --- The app menu -------------------------------------------------------

	/** Opens the menu sheet and waits for it to be on screen. */
	async openMenu() {
		await this.page.getByRole('button', { name: 'Menu', exact: true }).click()
		await expect(this.themeTrigger).toBeVisible()
	}

	/**
	 * The menu sheet itself, only while it is on screen.
	 *
	 * Picked out by the choosers it holds rather than by its label, which is
	 * localized, or by `.sheet` alone, which the dice keypad shares.
	 */
	get menuSheet(): Locator {
		return this.page.locator('dialog.sheet[open]:has([aria-haspopup="listbox"])')
	}

	/**
	 * The language dropdown's trigger. Like the theme one, its accessible name
	 * carries the current choice -- "Language: English", "Taal: Nederlands".
	 */
	get languageTrigger(): Locator {
		return this.page.getByRole('button', { name: /^(Language|Taal): / })
	}

	/**
	 * The theme dropdown's trigger. Its accessible name carries the current
	 * choice -- "Theme: Dark" -- which is what the menu shows the player, so
	 * asserting on it is asserting on what they see.
	 */
	get themeTrigger(): Locator {
		return this.page.getByRole('button', { name: /^Theme: / })
	}

	/** Picks a theme from the open menu, by the option's visible label. */
	async chooseTheme(theme: 'System' | 'Sensor' | 'Light' | 'Dark') {
		await this.themeTrigger.click()
		await this.page.getByRole('option', { name: new RegExp(`^${theme}`) }).click()
		await expect(this.themeTrigger).toHaveAccessibleName(`Theme: ${theme}`)
	}

	// --- The menu's dropdowns ----------------------------------------------

	/** The open dropdown list. There is only ever one. */
	get listbox(): Locator {
		return this.page.getByRole('listbox')
	}

	/**
	 * The label of the option the open list currently points at.
	 *
	 * Focus stays on the listbox and the active option is named by
	 * `aria-activedescendant`, so this is the only place the keyboard position
	 * is readable -- and asserting on it is asserting on what a screen reader
	 * would say.
	 */
	async activeOption(): Promise<string | null> {
		return this.listbox.evaluate((list) => {
			const id = list.getAttribute('aria-activedescendant')
			if (!id) return null
			return list.querySelector(`#${CSS.escape(id)}`)?.getAttribute('data-label') ?? null
		})
	}

	/** The remembered theme, straight out of the storage the app persists it to. */
	async storedTheme(): Promise<string | null> {
		return this.page.evaluate(() => window.localStorage.getItem('theme'))
	}

	/** What `theme-sensor` resolved the choice to: 'light' or 'dark'. */
	async resolvedTheme(): Promise<string | undefined> {
		return this.page.evaluate(() => document.documentElement.dataset.theme)
	}
}
