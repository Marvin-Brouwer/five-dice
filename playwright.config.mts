/**
 * So `playwright test` works from the repo root as well as from the package.
 * Without a config here, Playwright falls back to scanning the working
 * directory and reports that it found no tests.
 *
 * The real config anchors every path to its own directory, so re-exporting it
 * is enough — see app/playwright.config.mts.
 */
export { default } from './app/playwright.config.mts'
