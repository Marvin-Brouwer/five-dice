/**
 * Written by scripts/textures/generate.mts, and checked in.
 *
 * Not build output: regenerating a variant is something you do on purpose,
 * and it overwrites that variant alone. See docs/textures.md.
 */

export const paperTextures = [
	() => import('./paper-texture-0.svg?raw'),
	() => import('./paper-texture-1.svg?raw'),
	() => import('./paper-texture-2.svg?raw'),
	() => import('./paper-texture-3.svg?raw'),
	() => import('./paper-texture-4.svg?raw'),
]
