import { describe, expect, test } from 'vitest'

import {
	paperTextureMarkup, patternIdPlaceholder,
} from '../../src/_shared/textures/paper-texture-markup.mts'
import { paperTextures } from '../../src/_shared/textures/paper-textures.g.mts'

describe('paperTexture', () => {

	test('draws the mesh the variant names', () => {
		const drawn = paperTextures.map((_, variant) => paperTextureMarkup(variant, 'id'))

		expect(drawn.every((markup) => markup !== undefined)).toBe(true)
		expect(new Set(drawn).size).toBe(paperTextures.length)
	})

	test('draws nothing for a device that has not picked one', () => {
		// Deliberately not variant 0: a device without a variant gets a plain
		// sheet rather than being quietly put on everyone else's mesh.
		expect(paperTextureMarkup(undefined, 'id')).toBeUndefined()
	})

	test('draws nothing for a variant that does not exist', () => {
		for (const variant of [paperTextures.length, 99, -1, 1.5, NaN]) {
			expect(paperTextureMarkup(variant, 'id')).toBeUndefined()
		}
	})

	test('fills in the pattern id, leaving no placeholder behind', () => {
		const markup = paperTextureMarkup(0, 'paper-texture-7')

		expect(markup).not.toContain(patternIdPlaceholder)
		expect(markup).toContain('id="paper-texture-7"')
		expect(markup).toContain('fill="url(#paper-texture-7)"')
	})

	test('gives each instance its own id', () => {
		// Two cards on one page drawing the same mesh would otherwise emit
		// duplicate ids; both rects resolve to whichever came first, so
		// unmounting that card takes the defs the survivor still points at.
		const first = paperTextureMarkup(2, 'paper-texture-0')
		const second = paperTextureMarkup(2, 'paper-texture-1')

		expect(first).not.toBe(second)
		expect(second).toContain('id="paper-texture-1"')
		expect(second).not.toContain('paper-texture-0')
	})
})
