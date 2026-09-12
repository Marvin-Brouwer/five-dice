import { component } from '@rooted/components'

import styles from './paper-texture.css'

/**
 * The paper card's low-poly sheet.
 *
 * A component rather than a CSS background because the facets are filled with
 * `var(--paper-shade-*)`: an SVG behind `url()` renders in secure static mode
 * and never sees the page's cascade, so it would paint those fills black.
 * Inlined into the document it resolves them like any other element, which is
 * how one mesh serves every theme — the same trick `Icon` uses for
 * `currentColor`.
 */

/**
 * The meshes, lazily and by directory rather than by list: adding a sixth is
 * dropping a sixth file next to the others, with nothing to regenerate and no
 * count that can drift from what is on disk. A device draws one, so the other
 * four never reach the bundle it parses before first paint.
 */
const meshes = import.meta.glob<string>('./paper-texture-*.svg', {
	query: '?raw',
	import: 'default',
})

/** Sorted by number, or `paper-texture-10` would land before `paper-texture-2`. */
const variantOf = (path: string) => Number(path.replace(/\D+/g, ''))

const paperTextures = Object.entries(meshes)
	.sort(([a], [b]) => variantOf(a) - variantOf(b))
	.map(([, load]) => load)

export const paperTextureCount = paperTextures.length

export type PaperTextureOptions = {
	/**
	 * Which mesh to draw, normally the device's stored variant. Nothing is
	 * rendered when it is missing or names a mesh that doesn't exist, which
	 * leaves a plain sheet rather than putting everyone on the same mesh.
	 */
	variant?: number
}

export const PaperTexture = component<PaperTextureOptions>({
	name: 'paper-texture',
	styles,
	async onMount({ append, element, options, signal }) {
		const load = paperTextures[options.variant ?? -1]
		if (load === undefined) return

		const markup = await load()
		// The mesh arrives a tick late, by which time the card may be gone.
		if (signal.aborted) return

		append(element('span', {
			classes: styles.texture,
			aria: {
				hidden: 'true',
			},
			innerHTML: markup,
		}))
	},
})
