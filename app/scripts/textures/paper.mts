/**
 * The paper card's low-poly mesh.
 *
 * The tile is 200x100 and repeats, so the geometry is constrained:
 *
 *  - The corners are pinned.
 *  - The top and bottom edges are split at the same x, the left and right
 *    edges at the same y — otherwise the split points don't line up with the
 *    neighbouring tile.
 *  - Triangles facing each other across opposite edges carry the same shade.
 *    Without that, the seam shows up as a dead-straight colour change running
 *    the full width or height of the tile, every 200px, which is exactly the
 *    repeat we're trying to hide.
 *
 * Only the two interior points and the two edge splits actually move. That is
 * the same topology as the hand-drawn original, which variant 0 reproduces.
 */

export const paperWidth = 200
export const paperHeight = 100

/**
 * Facets are filled with custom properties rather than literal colours, so one
 * mesh serves every theme. The actual shades live in index.tokens.css beside
 * the rest of the palette; this file only decides which of the three a facet
 * gets. That works because the markup is inlined into the document — an SVG
 * loaded through `url()` renders in secure static mode and never sees the
 * page's cascade.
 */
export const shadeProperty = (shade: number) => `var(--paper-shade-${shade})`

/**
 * Placeholder for the pattern's id, swapped for a per-instance one when the
 * texture is mounted. Two cards showing the same variant would otherwise carry
 * duplicate ids, and unmounting the first would take the `<defs>` the second is
 * still pointing at with it.
 */
export const patternIdPlaceholder = '__ID__'

export type Point = readonly [number, number]

export type PaperMesh = {
	/** Split point shared by the top and bottom edges. */
	readonly splitX: number
	/** Split point shared by the left and right edges. */
	readonly splitY: number
	readonly inner1: Point
	readonly inner2: Point
	/** Palette index per triangle, in emit order. */
	readonly shades: readonly number[]
}

/**
 * Jitter ranges. Chosen so no triangle can collapse: every combination inside
 * these bounds clears `minimumArea` with room to spare, and `isWellFormed`
 * guards the ranges if they're ever widened.
 */
const splitXRange = [80, 120] as const
const splitYRange = [40, 60] as const
const inner1Range = [[40, 80], [30, 60]] as const
const inner2Range = [[120, 160], [40, 70]] as const

/** A triangle thinner than this reads as a crease rather than a facet. */
const minimumArea = 80

/**
 * Every shade has to cover at least this many of the ten facets. Merely
 * requiring all three to appear isn't enough — it lets through meshes where
 * eight facets share one shade and the paper comes out flat.
 */
const minimumFacetsPerShade = 2

/**
 * The ten triangles, in the order the original file draws them. Indices in the
 * comments are the `shades` positions the seam constraint talks about.
 */
export function paperTriangles(mesh: PaperMesh): Point[][] {
	const { splitX, splitY, inner1, inner2 } = mesh
	const topLeft: Point = [0, 0]
	const topRight: Point = [paperWidth, 0]
	const bottomLeft: Point = [0, paperHeight]
	const bottomRight: Point = [paperWidth, paperHeight]
	const top: Point = [splitX, 0]
	const bottom: Point = [splitX, paperHeight]
	const left: Point = [0, splitY]
	const right: Point = [paperWidth, splitY]

	return [
		[topLeft, top, inner1],        // 0 — owns the top edge, left of the split
		[topLeft, left, inner1],       // 1 — owns the left edge, above the split
		[top, topRight, inner2],       // 2 — owns the top edge, right of the split
		[top, inner1, inner2],         // 3
		[topRight, right, inner2],     // 4 — owns the right edge, above the split
		[left, inner1, bottom],        // 5
		[left, bottomLeft, bottom],    // 6 — owns the left edge below, and the bottom edge left
		[inner1, inner2, bottom],      // 7
		[inner2, right, bottomRight],  // 8 — owns the right edge, below the split
		[inner2, bottom, bottomRight], // 9 — owns the bottom edge, right of the split
	]
}

/**
 * Expands the six freely drawn shades into all ten, deriving the four that the
 * seam pins: the triangle across each edge must match the one facing it.
 */
export function expandShades(free: readonly number[]): number[] {
	const [topLeftWedge, leftWedge, topRightWedge, upperMiddle, lowerLeft, lowerMiddle] = free
	return [
		topLeftWedge,  // 0
		leftWedge,     // 1
		topRightWedge, // 2
		upperMiddle,   // 3
		leftWedge,     // 4 — right edge above the split matches the left edge (1)
		lowerLeft,     // 5
		topLeftWedge,  // 6 — bottom edge left of the split matches the top edge (0)
		lowerMiddle,   // 7
		topLeftWedge,  // 8 — right edge below the split matches the left edge (6)
		topRightWedge, // 9 — bottom edge right of the split matches the top edge (2)
	]
}

/** The hand-drawn original, so variant 0 regenerates the look we already have. */
export const originalPaperMesh: PaperMesh = {
	splitX: 100,
	splitY: 50,
	inner1: [60, 45],
	inner2: [140, 55],
	shades: expandShades([0, 1, 2, 0, 2, 1]),
}

/** True when no shade is crowded out by the other two. */
export function isBalanced(shades: readonly number[]): boolean {
	return [0, 1, 2].every((shade) =>
		shades.filter((value) => value === shade).length >= minimumFacetsPerShade)
}

function isWellFormed(mesh: PaperMesh): boolean {
	return paperTriangles(mesh).every(([a, b, c]) => {
		const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2
		return area >= minimumArea
	})
}

function pick(random: () => number, [min, max]: readonly [number, number]): number {
	return Math.round(min + random() * (max - min))
}

export function createPaperMesh(random: () => number): PaperMesh {
	for (let attempt = 0; attempt < 100; attempt++) {
		const free = Array.from({ length: 6 }, () => Math.floor(random() * 3))
		const shades = expandShades(free)
		if (!isBalanced(shades)) continue

		const mesh: PaperMesh = {
			splitX: pick(random, splitXRange),
			splitY: pick(random, splitYRange),
			inner1: [pick(random, inner1Range[0]), pick(random, inner1Range[1])],
			inner2: [pick(random, inner2Range[0]), pick(random, inner2Range[1])],
			shades,
		}
		if (isWellFormed(mesh)) return mesh
	}
	throw new Error('Could not draw a well-formed paper mesh in 100 attempts')
}

export function renderPaperTexture(mesh: PaperMesh, header: string): string {
	const polygons = paperTriangles(mesh).map((triangle, index) => {
		const points = triangle.map(([x, y]) => `${x},${y}`).join(' ')
		return `\t\t\t<polygon points="${points}" fill="${shadeProperty(mesh.shades[index])}"/>`
	})

	// A <pattern> rather than a bare tile: the sheet is sized by its content, so
	// the texture repeats to fill whatever the card turns out to be.
	return [
		header,
		'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">',
		'\t<defs>',
		`\t\t<pattern id="${patternIdPlaceholder}" width="${paperWidth}" height="${paperHeight}" patternUnits="userSpaceOnUse">`,
		...polygons,
		'\t\t</pattern>',
		'\t</defs>',
		`\t<rect width="100%" height="100%" fill="url(#${patternIdPlaceholder})"/>`,
		'</svg>',
		'',
	].join('\n')
}
