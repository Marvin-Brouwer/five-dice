import { localStorage } from '@rooted/storage/web'

import { noiseVariantCount, paperVariantCount } from '../textures/textures.g.mts'

/**
 * Gives each device its own paper and cardboard.
 *
 * The pad gets passed around a table, so two players holding their phones side
 * by side should not be looking at the same sheet. Paper and grain are drawn
 * separately — five of each is 25 combinations, which keeps a collision between
 * four players at the same table uncommon rather than the coin-flip it would be
 * if one number picked both.
 *
 * What is stored is the chosen variant, not a random id or a timestamp: a
 * number under five, shared with a fifth of everyone who opens the app. It
 * cannot single out a device, so it sits alongside the `theme` key as one more
 * style preference rather than anything that needs consenting to.
 */

const paperKey = 'texture-paper'
const noiseKey = 'texture-noise'

/**
 * Keeps the stored variant when it still names one that exists, and draws a new
 * one otherwise. The re-draw matters when the variant count shrinks: without it
 * every device above the new count would fall through to the CSS default and
 * pile onto variant 0.
 */
export function resolveVariant(stored: unknown, count: number, random: () => number): number {
	const isUsable = typeof stored === 'number'
		&& Number.isInteger(stored)
		&& stored >= 0
		&& stored < count
	return isUsable ? stored as number : Math.floor(random() * count)
}

function readVariant(key: string, count: number): number {
	const stored = localStorage.get(key)
	const variant = resolveVariant(stored, count, Math.random)
	if (variant !== stored) localStorage.set(key, variant)
	return variant
}

if (typeof document !== 'undefined') {
	// Read by textures.g.css. Until this runs the page shows variant 0, which is
	// the original hand-drawn texture — so losing the race to first paint costs
	// nothing more than the texture this app has always had.
	document.documentElement.dataset.paper = String(readVariant(paperKey, paperVariantCount))
	document.documentElement.dataset.noise = String(readVariant(noiseKey, noiseVariantCount))
}
