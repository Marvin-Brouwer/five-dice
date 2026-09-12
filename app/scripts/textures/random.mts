/**
 * Deterministic randomness for the texture generator. A generated variant has
 * to be reproducible from its seed — the seed is printed and written into each
 * file's header so a mesh you like can be made again.
 */

/** mulberry32 — small, fast, and good enough for jittering a dozen points. */
export function createRandom(seed: number): () => number {
	let state = seed >>> 0
	return () => {
		state = (state + 0x6D2B79F5) >>> 0
		let value = state
		value = Math.imul(value ^ (value >>> 15), value | 1)
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296
	}
}

/**
 * Derives a variant's own seed from the run seed. Each variant draws from its
 * own stream, so regenerating variant 3 leaves the other files byte-identical
 * instead of shifting everything after it.
 */
export function variantSeed(seed: number, kind: string, variant: number): number {
	let hash = seed >>> 0
	for (const character of `${kind}:${variant}`) {
		hash = Math.imul(hash ^ character.charCodeAt(0), 0x01000193) >>> 0
	}
	return hash
}
