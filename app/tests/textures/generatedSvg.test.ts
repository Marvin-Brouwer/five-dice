import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { noiseVariantCount, paperVariantCount } from '../../src/_shared/textures/textures.g.mts'

/**
 * Guards the committed texture files themselves, not just the functions that
 * render them — a hand-edited file is exactly as broken as a generated one.
 */

const texturesDir = fileURLToPath(new URL('../../src/_shared/textures/', import.meta.url))
const svgNames = readdirSync(texturesDir).filter((name) => name.endsWith('.svg')).sort()
const read = (name: string) => readFileSync(join(texturesDir, name), 'utf8')

describe('generated textures', () => {

	test('every declared variant is on disk', () => {
		const expected = [
			...Array.from({ length: paperVariantCount }, (_, v) => `paper-texture-${v}.svg`),
			...Array.from({ length: paperVariantCount }, (_, v) => `paper-texture-${v}-dark.svg`),
			...Array.from({ length: noiseVariantCount }, (_, v) => `page-noise-${v}.svg`),
		].sort()

		// A count that outruns the files leaves those devices with no texture at
		// all, and files past the count ship bytes nothing references.
		expect(svgNames).toEqual(expected)
	})

	test.each(svgNames)('%s is well-formed XML', (name) => {
		const markup = read(name)

		// Regression: the generated header separated its clauses with " -- ".
		// XML forbids "--" inside a comment, so the browser rejected all fifteen
		// files and the page painted no texture whatsoever — silently, because
		// the CSS variable still resolved to a plausible-looking data URI.
		for (const comment of markup.match(/<!--[\s\S]*?-->/g) ?? []) {
			expect(comment.slice(4, -3)).not.toContain('--')
		}

		expect(markup.startsWith('<!--')).toBe(true)
		expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"')
		expect(markup.endsWith('</svg>\n')).toBe(true)
	})

	test.each(svgNames.filter((name) => name.startsWith('paper-texture')))(
		'%s tiles: opposite edges are split alike and shaded alike', (name) => {
			const markup = read(name)
			const facets = [...markup.matchAll(/points="([^"]*)" fill="([^"]*)"/g)]
				.map(([, points, fill]) => ({
					points: points.split(' ').map((pair) => pair.split(',').map(Number)),
					fill,
				}))

			expect(facets).toHaveLength(10)

			const edge = (axis: 0 | 1, value: number) => new Set(
				facets.flatMap(({ points }) => points.filter((point) => point[axis] === value))
					.map((point) => point[axis === 0 ? 1 : 0]))

			// Split points must line up with the neighbouring tile.
			expect(edge(1, 0)).toEqual(edge(1, 100))
			expect(edge(0, 0)).toEqual(edge(0, 200))

			// And the facets facing each other across the seam must match, or the
			// repeat shows as a straight colour break every 200px.
			expect(facets[6].fill).toBe(facets[0].fill)
			expect(facets[9].fill).toBe(facets[2].fill)
			expect(facets[4].fill).toBe(facets[1].fill)
			expect(facets[8].fill).toBe(facets[6].fill)
		})

	test.each(Array.from({ length: paperVariantCount }, (_, variant) => variant))(
		'paper variant %i pairs light and dark on identical geometry', (variant) => {
			const geometry = (markup: string) => markup.replace(/ fill="#[0-9a-f]{6}"/g, '')
			const light = read(`paper-texture-${variant}.svg`)
			const dark = read(`paper-texture-${variant}-dark.svg`)

			expect(geometry(dark)).toBe(geometry(light))
			expect(dark).not.toBe(light)
		})
})
