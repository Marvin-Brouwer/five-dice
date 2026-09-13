/**
 * Draws the link-preview card into app/public/og-card.png.
 *
 *   pnpm generate:social-card
 *
 *   --out <path>    where to write it     (default: public/og-card.png)
 *   --html <path>   also write the page the screenshot is of, for a look
 *   --dry-run       report the write without making it
 *
 * Chromium takes the picture, because the card is the app's own CSS —
 * tokens, the paper mesh, the mono wordmark, the handwritten tagline — and a
 * browser is the only thing that renders that faithfully. It needs the fonts,
 * so this one wants a network connection; the result is committed, so nobody
 * needs to run it to build the app.
 *
 * Rerun it when the palette, the wordmark or the masthead changes. The PNG is
 * the deliverable, card.mts is the design.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { chromium } from '@playwright/test'

import { cardHeight, cardWidth, socialCardHtml } from './card.mts'

const appDir = fileURLToPath(new URL('../../', import.meta.url))
const read = (path: string) => readFileSync(resolve(appDir, path), 'utf8')

/**
 * The two faces the card is set in — the wordmark's mono caps and the hand the
 * tagline is written in — from the same foundry index.html loads them from.
 * Only the weights the card uses: everything here is fetched and inlined.
 */
const fontsHref = 'https://fonts.googleapis.com/css2'
	+ '?family=Caveat:wght@500&family=IBM+Plex+Mono:wght@700'

/**
 * Google Fonts serves a different stylesheet per browser. Asking as Chromium
 * is what gets woff2 back rather than a decade-old fallback format.
 */
const fontsUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
	+ ' (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const { values } = parseArgs({
	options: {
		out: { type: 'string', default: 'public/og-card.png' },
		html: { type: 'string' },
		'dry-run': { type: 'boolean', default: false },
	},
})

const outPath = resolve(appDir, values.out)
const dryRun = values['dry-run']

const html = socialCardHtml({
	tokensCss: read('index.tokens.css'),
	paperTexture0: read('src/_shared/textures/paper-texture-0.svg'),
	pageNoiseTexture: toDataUri(read('src/_shared/textures/page-noise.svg')),
	fontsCss: await fetchFonts(),
})

if (values.html !== undefined) {
	const htmlPath = resolve(appDir, values.html)
	if (!dryRun) writeFileSync(htmlPath, html)
	console.log(`${relative(appDir, htmlPath)} ${dryRun ? '(dry run)' : 'written'}`)
}

const png = await screenshot(html)

if (dryRun) {
	console.log(`${basename(outPath)}: ${describe(png)} (dry run)`)
} else if (existsSync(outPath) && readFileSync(outPath).equals(png)) {
	console.log(`${basename(outPath)}: unchanged`)
} else {
	writeFileSync(outPath, png)
	console.log(`${basename(outPath)}: ${describe(png)}`)
}

/**
 * An SVG small enough to carry inline, and one a CSS `url()` can read: the
 * grain is painted as a background, which rules out the inlined-markup route
 * the paper mesh takes.
 */
function toDataUri(markup: string): string {
	return `data:image/svg+xml;base64,${Buffer.from(markup).toString('base64')}`
}

/**
 * The stylesheet, with every font file it points at pulled in and inlined.
 *
 * The page then has nothing to load, so the shot cannot race a face that is
 * still arriving, and the intermediate `--html` opens the same everywhere. The
 * card is set in ASCII, so the Cyrillic, Greek and Vietnamese cuts of these
 * families are skipped — they are fetched by the hundred kilobytes and never
 * draw a glyph.
 */
async function fetchFonts(): Promise<string> {
	const stylesheet = await get(fontsHref).then((response) => response.text())

	const faces = stylesheet
		.split('@font-face')
		.filter((block) => block.includes('U+0000-00FF'))
		.map((block) => `@font-face${block.slice(0, block.lastIndexOf('}') + 1)}`)

	if (faces.length === 0) throw new Error(`No latin faces in the stylesheet at ${fontsHref}`)

	return (await Promise.all(faces.map(inlineFontFiles))).join('\n')
}

async function inlineFontFiles(face: string): Promise<string> {
	const sources = [...face.matchAll(/url\((https:\/\/[^)]+)\)/g)]

	let inlined = face
	for (const [source, url] of sources) {
		const file = await get(url!).then((response) => response.arrayBuffer())
		const encoded = Buffer.from(file).toString('base64')
		inlined = inlined.replace(source, `url(data:font/woff2;base64,${encoded})`)
	}
	return inlined
}

async function get(url: string): Promise<Response> {
	const response = await fetch(url, { headers: { 'user-agent': fontsUserAgent } })
	if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`)
	return response
}

async function screenshot(page: string): Promise<Buffer> {
	// The same escape hatch the e2e config offers, for the same reason — see
	// playwright.config.mts. `channel` picks the full browser over the headless
	// shell, which not every distribution ships.
	const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH
	const browser = await chromium.launch({
		channel: 'chromium',
		...(executablePath ? { executablePath } : {}),
	})
	try {
		const context = await browser.newContext({
			viewport: { width: cardWidth, height: cardHeight },
			// A scraper scales the card down, never up, so the extra pixels of
			// a retina shot would be weight with nothing to show for it.
			deviceScaleFactor: 1,
			// The card is one fixed image; an animated settle would only make
			// the shot depend on when it was taken.
			reducedMotion: 'reduce',
		})

		const tab = await context.newPage()
		await tab.setContent(page, { waitUntil: 'load' })
		// Everything the page needs is inlined, but the faces are still decoded
		// asynchronously, and a shot taken before that is set in a fallback.
		// As source rather than a callback: this half of the repo is typed
		// without the DOM, which is the honest description of a Node script.
		await tab.evaluate('document.fonts.ready.then(() => true)')

		return await tab.screenshot({ type: 'png' })
	} finally {
		await browser.close()
	}
}

function describe(png: Buffer): string {
	// Both dimensions live in the PNG's IHDR chunk, at a fixed offset.
	const width = png.readUInt32BE(16)
	const height = png.readUInt32BE(20)
	return `${width}×${height}, ${Math.round(png.byteLength / 1024)} kB`
}
