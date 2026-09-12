import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { patternIdPlaceholder } from '../../scripts/textures/paper.mts'
import { paperTextures } from '../../src/_shared/textures/paper-textures.mts'
import { noiseVariantCount } from '../../src/_shared/textures/page-noise.mts'

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
			...Array.from({ length: paperTextures.length }, (_, v) => `paper-texture-${v}.svg`),
			...Array.from({ length: noiseVariantCount }, (_, v) => `page-noise-${v}.svg`),
		].sort()

		// A count that outruns the files leaves those devices with no texture at
		// all, and files past the count ship bytes nothing references.
		expect(svgNames).toEqual(expected)
	})

	test.each(svgNames)('%s is well-formed XML', (name) => {
		const markup = read(name)

		// The files carry no comments now, but a hand-added one still has to
		// obey this: XML forbids "--" inside a comment, and an SVG that isn't
		// well-formed is rejected outright — the texture stops painting with no
		// error anywhere. That cost a debugging session once.
		for (const comment of markup.match(/<!--[\s\S]*?-->/g) ?? []) {
			expect(comment.slice(4, -3)).not.toContain('--')
		}

		expect(markup.startsWith('<svg')).toBe(true)
		expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"')
		expect(markup.endsWith('</svg>\n')).toBe(true)
	})

	test.each(svgNames.filter((name) => name.startsWith('paper-texture')))(
		'%s is themeable: facets are custom properties, not baked colours', (name) => {
			const markup = read(name)

			// The whole point of the component: a literal colour here would need a
			// second file per theme, which is what this replaced.
			expect(markup).not.toMatch(/fill="#[0-9a-f]{3,8}"/)
			expect(markup).toMatch(/fill="var\(--paper-shade-[012]\)"/)

			// The placeholder the component swaps for a per-instance id, as the
			// generator spells it. paperTexture.test.ts checks the component
			// still spells it the same way.
			expect(markup).toContain(`id="${patternIdPlaceholder}"`)
			expect(markup).toContain(`fill="url(#${patternIdPlaceholder})"`)
			expect(markup).toContain('patternUnits="userSpaceOnUse"')
			expect(markup).toContain('width="200" height="100"')
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

})
