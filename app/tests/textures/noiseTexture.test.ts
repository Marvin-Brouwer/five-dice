import { describe, expect, test } from 'vitest'

import { createNoiseSeed, renderNoiseTexture } from '../../scripts/textures/noise.mts'
import { createRandom } from '../../scripts/textures/random.mts'

describe('noise texture', () => {

	test('the same seed renders the same markup', () => {
		expect(renderNoiseTexture(7)).toBe(renderNoiseTexture(7))
		expect(createNoiseSeed(createRandom(9))).toBe(createNoiseSeed(createRandom(9)))
	})

	test('only the seed varies between variants', () => {
		const withoutSeed = (markup: string) => markup.replace(/ seed="\d+"/, '')

		expect(withoutSeed(renderNoiseTexture(4321))).toBe(withoutSeed(renderNoiseTexture(0)))
	})

	test('keeps stitching, or the field stops tiling', () => {
		expect(renderNoiseTexture(1)).toContain('stitchTiles="stitch"')
	})

	test('variant 0 uses seed 0, the SVG default the original relied on', () => {
		expect(renderNoiseTexture(0)).toContain('seed="0"')
	})

	test('markup is a 200x200 tile ending in a newline', () => {
		const markup = renderNoiseTexture(1)

		expect(markup.startsWith('<svg ')).toBe(true)
		expect(markup).toContain('viewBox="0 0 200 200"')
		expect(markup.endsWith('</svg>\n')).toBe(true)
	})
})
