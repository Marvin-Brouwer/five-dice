import { paperTextures } from './paper-textures.mts'

/**
 * Picking a mesh and stamping its pattern id, kept apart from the component
 * that renders it.
 *
 * `component()` injects its stylesheet at module load, so importing
 * `paper-texture.mts` needs a document. Tests here run on node, so the part
 * worth testing — which mesh a variant gets, and that every instance ends up
 * with its own id — lives in this module instead.
 */

/**
 * What the generated meshes carry in place of a real id. Kept in step with
 * `scripts/textures/paper.mts` by `tests/textures/generatedSvg.test.ts` — app
 * code can't import from the build scripts, so the literal lives in both places
 * and a test holds them together.
 */
export const patternIdPlaceholder = '__ID__'

/**
 * The mesh for `variant`, with its pattern id filled in — or nothing at all
 * when the variant is missing or names a mesh that doesn't exist. Drawing
 * nothing leaves a plain sheet, which is the right answer for a device that
 * hasn't picked yet: putting it on variant 0 would quietly crowd everyone onto
 * the same mesh.
 */
export function paperTextureMarkup(variant: number | undefined, id: string): string | undefined {
	if (!Number.isInteger(variant)) return undefined

	const markup = paperTextures[variant as number]
	return markup?.replaceAll(patternIdPlaceholder, id)
}
