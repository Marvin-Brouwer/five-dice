import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig, devices } from '@playwright/test'

/**
 * Everything is anchored to this file rather than to the working directory,
 * so the suite runs the same whether you are standing in this package, at the
 * repo root, or anywhere else.
 */
const here = path.dirname(fileURLToPath(import.meta.url))

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
	testDir: path.join(here, 'e2e'),
	globalSetup: path.join(here, 'e2e', 'global-setup.mts'),
	outputDir: path.join(here, 'test-results'),
	// Not `*.spec.*`: this package has no vitest config, so vitest runs on its
	// defaults and would glob those files into `pnpm test` and fail on them.
	testMatch: '**/*.e2e.mts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI
		? 'list'
		: [['list'], ['html', { open: 'never', outputFolder: path.join(here, 'playwright-report') }]],
	use: {
		baseURL,
		// A playthrough is worth watching, and video plus the final board come
		// to about 1.7MB a game -- cheap enough to always keep locally. The
		// trace is the outlier at ~20MB each, so it is kept only when a run
		// fails, which is the only time its per-action timeline earns that.
		trace: 'retain-on-failure',
		video: process.env.CI ? 'retain-on-failure' : 'on',
		screenshot: 'on',
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// Portrait: this is an installable phone-first PWA.
				viewport: { width: 420, height: 1000 },
				// Use the full browser rather than chromium-headless-shell,
				// which Playwright would otherwise pick for a headless run.
				// Not every distribution of the browsers ships the shell, and
				// the full build is the more representative thing to test
				// against anyway. `executablePath` below still wins when set.
				channel: 'chromium',
				...(executablePath ? { launchOptions: { executablePath } } : {}),
			},
		},
	],
	webServer: {
		command: 'pnpm dev',
		cwd: here,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
})
