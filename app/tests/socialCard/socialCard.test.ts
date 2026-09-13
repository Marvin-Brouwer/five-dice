import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { seo } from '../../src/seo.mts'

/**
 * Guards `public/og-card.png` and the tags that point at it.
 *
 * The card is a hand-kept image with no generator behind it — see
 * docs/social-card.md — so what can go wrong is not how it was drawn but
 * everything around it: the wrong shape, a relative URL, a preview whose
 * declared size has stopped matching the image it describes. Replace the PNG
 * with one of another size and this fails rather than shipping a preview that
 * lays itself out wrong.
 */

const appDir = fileURLToPath(new URL('../../', import.meta.url))
const read = (path: string) => readFileSync(appDir + path, 'utf8')

const card = readFileSync(appDir + 'public/og-card.png')
// Both dimensions live in the PNG's IHDR chunk, at a fixed offset.
const cardWidth = card.readUInt32BE(16)
const cardHeight = card.readUInt32BE(20)

const indexHtml = read('index.html')

describe('the social card', () => {

	test('is the size every platform crops against', () => {
		// A square image is a valid preview, but it renders as a thumbnail
		// beside the text rather than as the banner `summary_large_image` asks
		// for. Getting this wrong is the whole reason the card exists.
		expect([cardWidth, cardHeight]).toEqual([1200, 630])
	})

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
