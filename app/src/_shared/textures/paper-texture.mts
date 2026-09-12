import { component } from '@rooted/components'

import { paperTextures } from './paper-textures.mts'
import styles from './paper-texture.css'

/**
 * The paper card's low-poly sheet, one of `paperTextures.length` meshes.
 *
 * A component rather than a CSS background because the facets are filled with
 * `var(--paper-shade-*)`: an SVG behind `url()` renders in secure static mode
 * and never sees the page's cascade, so it would paint those fills black.
 * Inlined into the document it resolves them like any other element, which is
 * how one mesh serves every theme — the same trick `Icon` uses for
 * `currentColor`.
 */

export type PaperTextureOptions = {
	/**
	 * Which mesh to draw, normally the device's stored variant. Nothing is
	 * rendered when it is missing or names a mesh that doesn't exist, which
	 * leaves a plain sheet rather than putting everyone on the same mesh.
	 */
	variant?: number
}

/**
 * What the generated meshes carry in place of a real id. Kept in step with
 * `scripts/textures/paper.mts` by `tests/textures/generatedSvg.test.ts` — app
 * code can't import from the build scripts, so the literal lives in both places
 * and a test holds them together.
 */
export const patternIdPlaceholder = '__ID__'

/**
 * Pattern ids have to be unique per instance. Two cards drawing the same mesh
 * would otherwise emit the same id, both `url(#…)` references would resolve to
 * whichever came first in the document, and unmounting that card would take the
 * `<defs>` the other one is still pointing at — its texture would vanish.
 */
let instance = 0

/**
 * Loads the mesh for `variant` and stamps its pattern id — or resolves to
 * nothing when the variant is missing or names a mesh that doesn't exist.
 * Drawing nothing leaves a plain sheet, which is the right answer for a device
 * that hasn't picked yet: putting it on variant 0 would quietly crowd everyone
 * onto the same mesh.
 */
export async function paperTextureMarkup(
	variant: number | undefined, id: string,
): Promise<string | undefined> {
	if (!Number.isInteger(variant)) return undefined

	const load = paperTextures[variant as number]
	if (load === undefined) return undefined

	const { default: markup } = await load()
	return markup.replaceAll(patternIdPlaceholder, id)
}

export const PaperTexture = component<PaperTextureOptions>({
	name: 'paper-texture',
	styles,
	async onMount({ append, element, options, signal }) {
		const markup = await paperTextureMarkup(options.variant, `paper-texture-${instance++}`)
		// The mesh arrives a tick late, by which time the card may be gone.
		if (markup === undefined || signal.aborted) return

		append(element('span', {
			classes: styles.texture,
			aria: {
				hidden: 'true',
			},
			innerHTML: markup,
		}))
	},
})
