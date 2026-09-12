/**
 * @vitest-environment happy-dom
 * @vitest-environment-options { "settings": { "disableCSSFileLoading": true } }
 *
 * paper-texture.mts calls component(), which injects its stylesheet at module
 * load — that needs a document. Scoped to this file rather than configured
 * globally, so the rest of the suite keeps running on plain node. The stylesheet
 * itself is not under test and there is no dev server to fetch it from, so
 * leave it unloaded rather than let happy-dom log a failed request per run.
 */

import { describe, expect, test } from 'vitest'

import {
	paperTextureMarkup, patternIdPlaceholder,
} from '../../src/_shared/textures/paper-texture.mts'
import { paperTextures } from '../../src/_shared/textures/paper-textures.mts'
import { patternIdPlaceholder as generatorPlaceholder } from '../../scripts/textures/paper.mts'

describe('paperTexture', () => {

	test('draws the mesh the variant names', async () => {
		const drawn = await Promise.all(
			paperTextures.map((_, variant) => paperTextureMarkup(variant, 'id')))

		expect(drawn.every((markup) => markup !== undefined)).toBe(true)
		expect(new Set(drawn).size).toBe(paperTextures.length)
	})

	test('draws nothing for a device that has not picked one', async () => {
		// Deliberately not variant 0: a device without a variant gets a plain
		// sheet rather than being quietly put on everyone else's mesh.
		await expect(paperTextureMarkup(undefined, 'id')).resolves.toBeUndefined()
	})

	test('draws nothing for a variant that does not exist', async () => {
		for (const variant of [paperTextures.length, 99, -1, 1.5, NaN]) {
			await expect(paperTextureMarkup(variant, 'id')).resolves.toBeUndefined()
		}
	})

	test('agrees with the generator on the placeholder', () => {
		// App code can't import from the build scripts, so the literal lives in
		// both places. This is the only thing holding them together — drift and
		// every mesh ships with an unsubstituted id.
		expect(patternIdPlaceholder).toBe(generatorPlaceholder)
	})

	test('meshes load on demand, not at startup', async () => {
		// The point of the loaders: a device draws one mesh, so the other four
		// have no business in the bundle it parses before first paint.
		expect(paperTextures.every((load) => typeof load === 'function')).toBe(true)
	})

	test('fills in the pattern id, leaving no placeholder behind', async () => {
		const markup = await paperTextureMarkup(0, 'paper-texture-7')

		expect(markup).not.toContain(patternIdPlaceholder)
		expect(markup).toContain('id="paper-texture-7"')
		expect(markup).toContain('fill="url(#paper-texture-7)"')
	})

	test('gives each instance its own id', async () => {
		// Two cards on one page drawing the same mesh would otherwise emit
		// duplicate ids; both rects resolve to whichever came first, so
		// unmounting that card takes the defs the survivor still points at.
		const first = await paperTextureMarkup(2, 'paper-texture-0')
		const second = await paperTextureMarkup(2, 'paper-texture-1')

		expect(first).not.toBe(second)
		expect(second).toContain('id="paper-texture-1"')
		expect(second).not.toContain('paper-texture-0')
	})
})
