import { defineConfig, devices } from '@playwright/test'

const port = 5173
const baseURL = `http://localhost:${port}/five-dice/`

/**
 * Escape hatch for environments that already have a Chromium and no matching
 * Playwright download — a sandbox with a pinned build, or a machine where you
 * would rather point at the system browser than fetch another one. Leave it
 * unset and Playwright resolves its own, as usual.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH

export default defineConfig({
	testDir: './e2e',
	globalSetup: './e2e/global-setup.mts',
	// Not `*.spec.*`: this package has no vitest config, so vitest runs on its
	// defaults and would glob those files into `pnpm test` and fail on them.
	testMatch: '**/*.e2e.mts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// Portrait: this is an installable phone-first PWA.
				viewport: { width: 420, height: 1000 },
				...(executablePath ? { launchOptions: { executablePath } } : {}),
			},
		},
	],
	webServer: {
		command: 'pnpm dev',
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
})
