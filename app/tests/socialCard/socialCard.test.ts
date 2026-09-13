import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { cardHeight, cardWidth, socialCardHtml } from '../../scripts/social-card/card.mts'
import { seo } from '../../src/seo.mts'

/**
 * Guards the card and the tags that point at it. Nothing here renders a pixel
 * — the picture itself is a judgement call, and a screenshot test of it would
 * fail on a font-rendering difference rather than on a mistake.
 *
 * What can be asserted is everything that silently makes the card not work:
 * the wrong shape, a relative URL, a preview that has stopped matching the
 * image it describes.
 */

const appDir = fileURLToPath(new URL('../../', import.meta.url))
const read = (path: string) => readFileSync(appDir + path, 'utf8')

const html = socialCardHtml({
	tokensCss: read('index.tokens.css'),
	paperTexture0: read('src/_shared/textures/paper-texture-0.svg'),
	fontsCss: '',
})

const indexHtml = read('index.html')

describe('the social card', () => {

	test('is drawn at the size every platform crops against', () => {
		// A square image is a valid preview, but it renders as a thumbnail
		// beside the text rather than as the banner `summary_large_image` asks
		// for. Getting this wrong is the whole reason the card exists.
		expect([cardWidth, cardHeight]).toEqual([1200, 630])

		// Both dimensions live in the PNG's IHDR chunk, at a fixed offset.
		const png = readFileSync(appDir + 'public/og-card.png')

		expect(png.readUInt32BE(16)).toBe(cardWidth)
		expect(png.readUInt32BE(20)).toBe(cardHeight)
	})

	test('tosses the masthead roll', () => {
		const pipCounts = [...html.matchAll(/<svg viewBox[\s\S]*?<\/svg>/g)]
			.map((die) => die[0].match(/<circle/g)?.length)

		expect(pipCounts).toEqual([5, 1, 3, 6, 2])
	})

	test('takes its colours from the tokens rather than restating them', () => {
		// The point of reading index.tokens.css: a palette change has to reach
		// the card by regenerating it, not by someone remembering a hex code.
		const dice = html.match(/<rect [^>]*stroke="[^"]*"/)?.[0]

		expect(dice).toContain('fill="var(--color-die-face)"')
		expect(dice).toContain('stroke="var(--color-die-border)"')
		expect(html).toContain('background: var(--background-surface)')
		expect(html).toContain('background: var(--color-divider-strong)')
		expect(html).toContain('font-family: var(--font-mono)')
	})

	test('carries no sentence to translate', () => {
		// One image serves /en/ and /nl/ both. The wordmark is a name and stays
		// — the app does not translate it either — but a line of copy on the
		// card would be an English card everywhere it was shared.
		const words = html
			.slice(html.indexOf('<body>'))
			.replace(/<[^>]*>/g, ' ')
			.trim()

		expect(words).toBe('Five dice')
	})

})

describe('the tags that point at it', () => {

	test('og:image is absolute', () => {
		// The tag is injected verbatim into pages several directories deep, so
		// a relative path resolves against whichever page a scraper read —
		// /en/score-card/og-card.png, which is a 404.
		expect(seo.defaultOgImage).toMatch(/^https:\/\/\S+\/og-card\.png$/)
	})

	test('the card format is declared, because the image is a wide one', () => {
		// `twitter:card` is the only tag that controls format, and X reads it
		// from the twitter: namespace alone. It and the wide image go together:
		// either without the other is worse than neither.
		expect(indexHtml).toContain('<meta name="twitter:card" content="summary_large_image" />')
	})

	test('the declared dimensions are the ones the card is drawn at', () => {
		expect(indexHtml).toContain(`<meta property="og:image:width" content="${cardWidth}" />`)
		expect(indexHtml).toContain(`<meta property="og:image:height" content="${cardHeight}" />`)
	})

})
