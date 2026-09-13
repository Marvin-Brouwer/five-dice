import { localStorage } from '@rooted/storage/web'

import { paperTextureCount } from '../textures/paper-texture.mts'

/**
 * Gives each device its own sheet of paper.
 *
 * The pad gets passed around a table, so two players holding their phones side
 * by side should not be looking at the same one. Five meshes means four players
 * will often have a pair between them — but the grain that used to vary
 * alongside it never read as different to anyone, so the combinations it added
 * were only ever arithmetic.
 *
 * What is stored is the chosen variant, not a random id or a timestamp: a
 * number under five, shared with a fifth of everyone who opens the app. It
 * cannot single out a device, so it sits alongside the `theme` key as one more
 * style preference rather than anything that needs consenting to.
 */

const paperKey = 'texture-paper'

/**
 * Keeps the stored mesh when it still names one that exists, and draws a new
 * one otherwise. The re-draw matters when a mesh is dropped: without it every
 * device above the new count would render no texture at all.
 */
export function resolveVariant(stored: unknown, count: number, random: () => number): number {
	const isUsable = typeof stored === 'number'
		&& Number.isInteger(stored)
		&& stored >= 0
		&& stored < count
	return isUsable ? stored as number : Math.floor(random() * count)
}

function readVariant(count: number): number {
	const stored = localStorage.get(paperKey)
	const variant = resolveVariant(stored, count, Math.random)
	if (variant !== stored) localStorage.set(paperKey, variant)
	return variant
}

/**
 * The mesh this device draws its paper with, handed to `PaperTexture` by
 * `PaperCard`. Undefined off the document — server-side there is nothing to
 * pick for, and the card renders a plain sheet.
 */
export const paperTextureVariant = typeof document === 'undefined'
	? undefined
	: readVariant(paperTextureCount)
