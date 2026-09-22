import { component } from '@rooted/components'
import { localStorage } from '@rooted/storage/web'
import { environment } from '@rooted/util'

import styles from './paper-texture.css'

/**
 * The paper card's low-poly sheet, and the one thing about this app that
 * differs per device.
 *
 * The score pad gets passed around a table, so two players holding their phones
 * side by side should not be looking at the same sheet. A mesh is picked on
 * first visit and kept.
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

/**
 * What is stored is the chosen mesh — a number under five — not a random id or
 * a timestamp. A fifth of everyone who opens the app has the same value, so it
 * cannot single out a device, which keeps it a style preference alongside
 * `theme` rather than anything that needs consenting to.
 */
const storageKey = 'texture-paper'

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

/**
 * Undefined anywhere but a real browser: there is nothing to pick for.
 *
 * The pre-render has a document, so this used to run there too -- picking a
 * mesh at build time and baking it into the HTML every device loads. One mesh
 * for everyone is the exact thing this file exists to avoid, so the
 * pre-rendered card carries no sheet and the client draws its own.
 */
function pickMesh(): number | undefined {
	if (!environment.is('client')) return undefined

	const stored = localStorage.get(storageKey)
	const variant = resolveVariant(stored, paperTextures.length, Math.random)
	if (variant !== stored) localStorage.set(storageKey, variant)
	return variant
}

const variant = pickMesh()

export const PaperTexture = component({
	name: 'paper-texture',
	styles,
	async onMount({ append, element, signal }) {
		// Nothing to draw off the document, or if the stored mesh has since been
		// deleted — a plain sheet beats crowding those devices onto mesh 0.
		const load = paperTextures[variant ?? -1]
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
