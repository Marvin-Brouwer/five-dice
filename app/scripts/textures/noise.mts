/**
 * The cardboard grain behind the page.
 *
 * This one is already procedural: `feTurbulence` takes a `seed`, and
 * `stitchTiles="stitch"` keeps the field tiling for any seed. Only the seed
 * varies between variants — `baseFrequency`, `numOctaves` and the opacity stay
 * put, so every variant reads as the same material at the same grain.
 *
 * Variant 0 uses seed 0, which is the SVG default and therefore renders
 * identically to the hand-written original that carried no `seed` at all.
 */

export const noiseSize = 200

export function createNoiseSeed(random: () => number): number {
	return Math.floor(random() * 10000)
}

export function renderNoiseTexture(seed: number, header: string): string {
	return [
		header,
		`<svg viewBox="0 0 ${noiseSize} ${noiseSize}" xmlns="http://www.w3.org/2000/svg">`,
		'\t<filter id="n">',
		`\t\t<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="${seed}" stitchTiles="stitch"/>`,
		'\t</filter>',
		'\t<rect width="100%" height="100%" filter="url(#n)" opacity="0.55"/>',
		'</svg>',
		'',
	].join('\n')
}
