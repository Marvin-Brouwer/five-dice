import type { DieValue } from '../../game/logic/gameConstants.ts'

/**
 * The shape of a die face, apart from anything that draws one.
 *
 * `PipDie` is the only component that renders dice, but it is not the only
 * thing that has to know what a die looks like: the social card is drawn by a
 * Node script (scripts/social-card/) that cannot import a component. Numbers
 * copied into that script would quietly drift the moment a pip moves, so both
 * read them from here.
 */

/** The box every coordinate below is expressed in. */
export const dieViewBox = '0 0 24 24'

/** The rounded square of the face itself, inset so its stroke stays inside the box. */
export const dieFrame = {
	x: 1,
	y: 1,
	width: 22,
	height: 22,
	rx: 3,
	ry: 3,
} as const

export const pipRadius = 2.1

/** Which cells of a 3×3 grid (0..8) carry a pip, per face. */
export const pipCells: Record<DieValue, number[]> = {
	1: [4],
	2: [0, 8],
	3: [0, 4, 8],
	4: [0, 2, 6, 8],
	5: [0, 2, 4, 6, 8],
	6: [0, 2, 3, 5, 6, 8],
}

/** Cell → centre coordinate, at a margin of ~4 around the 2.1r pips. */
export const pipCoordinates: Array<[number, number]> = [
	[ 6,  6], [12,  6], [18,  6],
	[ 6, 12], [12, 12], [18, 12],
	[ 6, 18], [12, 18], [18, 18],
]
