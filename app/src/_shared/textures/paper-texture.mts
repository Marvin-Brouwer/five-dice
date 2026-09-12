import { component } from '@rooted/components'

import { paperTextureMarkup } from './paper-texture-markup.mts'
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
 * Pattern ids have to be unique per instance. Two cards drawing the same mesh
 * would otherwise emit the same id, both `url(#…)` references would resolve to
 * whichever came first in the document, and unmounting that card would take the
 * `<defs>` the other one is still pointing at — its texture would vanish.
 */
let instance = 0

export const PaperTexture = component<PaperTextureOptions>({
	name: 'paper-texture',
	styles,
	onMount({ append, element, options }) {
		const markup = paperTextureMarkup(options.variant, `paper-texture-${instance++}`)
		if (markup === undefined) return

		append(element('span', {
			classes: styles.texture,
			aria: {
				hidden: 'true',
			},
			innerHTML: markup,
		}))
	},
})
