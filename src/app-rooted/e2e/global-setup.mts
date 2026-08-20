import { chromium, type FullConfig } from '@playwright/test'

/**
 * Load the app once before any test runs.
 *
 * On a cold dev server Vite optimises dependencies on the first module
 * request and then reloads the client. A spec unlucky enough to start during
 * that reload loses whatever it had on screen, which looks exactly like a
 * real failure. Taking the hit here makes the suite deterministic from a
 * clean checkout.
 */
export default async function globalSetup(config: FullConfig) {
	const [project] = config.projects
	const baseURL = project?.use.baseURL
	if (baseURL === undefined) return

	const browser = await chromium.launch({
		executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
	})
	try {
		const page = await browser.newPage()
		await page.goto(new URL('en/score-card/', baseURL).href, { waitUntil: 'domcontentloaded' })
		await page.waitForSelector('#score-card [data-field]', { timeout: 30_000 })
	}
	finally {
		await browser.close()
	}
}
