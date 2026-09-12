import { describe, expect, test } from 'vitest'

import { resolveVariant } from '../../src/_shared/services/texture-variant.mts'

const never = () => {
	throw new Error('should not have drawn a new variant')
}

describe('textureVariant', () => {

	test('keeps a stored variant', () => {
		expect(resolveVariant(3, 5, never)).toBe(3)
		expect(resolveVariant(0, 5, never)).toBe(0)
	})

	test('draws one for a device that has not got one yet', () => {
		expect(resolveVariant(undefined, 5, () => 0.5)).toBe(2)
	})

	test('re-draws when the variant no longer exists', () => {
		// Regression guard: dropping the variant count used to leave every
		// device above it falling through to the CSS default, piling them all
		// onto variant 0 instead of spreading them over what remains.
		expect(resolveVariant(7, 5, () => 0.5)).toBe(2)
	})

	test('re-draws on a value that is not a variant', () => {
		for (const stored of ['2', 2.5, -1, null, {}, NaN, Infinity]) {
			expect(resolveVariant(stored, 5, () => 0)).toBe(0)
		}
	})

	test('always lands inside the variant range', () => {
		for (let draw = 0; draw < 1; draw += 0.01) {
			const variant = resolveVariant(undefined, 5, () => draw)

			expect(variant).toBeGreaterThanOrEqual(0)
			expect(variant).toBeLessThan(5)
			expect(Number.isInteger(variant)).toBe(true)
		}
	})
})
