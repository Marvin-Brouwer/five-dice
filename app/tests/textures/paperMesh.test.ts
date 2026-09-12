import { describe, expect, test } from 'vitest'

import {
	createPaperMesh, isBalanced, originalPaperMesh, paperTriangles, renderPaperTexture,
	shadeProperty, type PaperMesh,
} from '../../scripts/textures/paper.mts'
import { createRandom, variantSeed } from '../../scripts/textures/random.mts'

const seeds = Array.from({ length: 300 }, (_, index) => index + 1)
const meshes = seeds.map((seed) => createPaperMesh(createRandom(seed)))

/** Fill of the triangle owning each boundary segment, by `shades` index. */
const edgeOwner = {
	topLeft: 0,
	topRight: 2,
	bottomLeft: 6,
	bottomRight: 9,
	leftUpper: 1,
	leftLower: 6,
	rightUpper: 4,
	rightLower: 8,
} as const

describe('paper mesh', () => {

	test('the same seed draws the same mesh', () => {
		expect(createPaperMesh(createRandom(42))).toEqual(createPaperMesh(createRandom(42)))
	})

	test('different seeds draw different meshes', () => {
		const rendered = new Set(meshes.map((mesh) => renderPaperTexture(mesh, '')))

		// Not all 300 need be unique — the parameter space is finite — but a
		// generator collapsing onto a handful of meshes would defeat the point.
		expect(rendered.size).toBeGreaterThan(200)
	})

	test('each variant draws from its own stream', () => {
		// Regenerating one variant must leave the others byte-identical, which
		// only holds if the per-variant seeds are independent.
		const first = variantSeed(1234, 'paper', 1)
		const second = variantSeed(1234, 'paper', 2)

		expect(first).not.toBe(second)
		expect(variantSeed(1234, 'paper', 1)).toBe(first)
		expect(variantSeed(1234, 'noise', 1)).not.toBe(first)
	})

	test('opposite edges carry matching shades, so the tile seam stays hidden', () => {
		for (const { shades } of meshes) {
			expect(shades[edgeOwner.bottomLeft]).toBe(shades[edgeOwner.topLeft])
			expect(shades[edgeOwner.bottomRight]).toBe(shades[edgeOwner.topRight])
			expect(shades[edgeOwner.rightUpper]).toBe(shades[edgeOwner.leftUpper])
			expect(shades[edgeOwner.rightLower]).toBe(shades[edgeOwner.leftLower])
		}
	})

	test('opposite edges are split at the same point, so tiles line up', () => {
		for (const mesh of meshes) {
			const points = paperTriangles(mesh).flat()
			const topSplits = points.filter(([, y]) => y === 0).map(([x]) => x)
			const bottomSplits = points.filter(([, y]) => y === 100).map(([x]) => x)
			const leftSplits = points.filter(([x]) => x === 0).map(([, y]) => y)
			const rightSplits = points.filter(([x]) => x === 200).map(([, y]) => y)

			expect(new Set(topSplits)).toEqual(new Set(bottomSplits))
			expect(new Set(leftSplits)).toEqual(new Set(rightSplits))
		}
	})

	test('no shade is crowded out', () => {
		for (const { shades } of meshes) expect(isBalanced(shades)).toBe(true)
	})

	test('no facet collapses into a crease', () => {
		for (const mesh of meshes) {
			for (const [a, b, c] of paperTriangles(mesh)) {
				const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2
				expect(area).toBeGreaterThanOrEqual(80)
			}
		}
	})

	test('every point stays inside the tile', () => {
		for (const mesh of meshes) {
			for (const [x, y] of paperTriangles(mesh).flat()) {
				expect(x).toBeGreaterThanOrEqual(0)
				expect(x).toBeLessThanOrEqual(200)
				expect(y).toBeGreaterThanOrEqual(0)
				expect(y).toBeLessThanOrEqual(100)
			}
		}
	})

	test('facets are filled with custom properties, never baked colours', () => {
		// One mesh per variant instead of a light and a dark copy: the theme
		// swaps the three tokens, and the geometry never moves with it.
		const markup = renderPaperTexture(meshes[0], '')

		expect(markup).not.toMatch(/fill="#/)
		for (const shade of [0, 1, 2]) expect(markup).toContain(shadeProperty(shade))
	})

	test('variant 0 is the hand-drawn original', () => {
		const original: PaperMesh = {
			splitX: 100,
			splitY: 50,
			inner1: [60, 45],
			inner2: [140, 55],
			shades: [0, 1, 2, 0, 1, 2, 0, 1, 0, 2],
		}

		expect(originalPaperMesh).toEqual(original)
		expect(isBalanced(originalPaperMesh.shades)).toBe(true)
	})

	test('markup is a tab-indented 200x100 tile ending in a newline', () => {
		const markup = renderPaperTexture(originalPaperMesh, '<!-- header -->')

		expect(markup.startsWith('<!-- header -->\n<svg ')).toBe(true)
		expect(markup).toContain('patternUnits="userSpaceOnUse"')
		expect(markup.match(/<polygon /g)).toHaveLength(10)
		expect(markup.endsWith('</svg>\n')).toBe(true)
	})
})
