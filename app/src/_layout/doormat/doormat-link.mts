import { component, optional } from '@rooted/components'
import { Link, type LinkOptions } from '@rooted/router'

import { Icon } from '../../_shared/icon/icon.mts'
import { localization } from '../../_shared/i18n/localization.mts'

import styles from './doormat-link.css'

import trailingIcon from './doormat-link.external.svg?raw'

export type DoormatLinkVariant = 'route' | 'external' | 'action'

export type DoormatLinkOptions = {
	label: string
	/**
	 * `route` navigates in-app through the router, `external` opens a new tab
	 * and carries its own ↗, `action` runs a callback and looks the same.
	 */
	variant: DoormatLinkVariant
	/**
	 * Where a `route` or `external` link points. Typed from the router's own
	 * option so a `href.for(...)` result passes straight through.
	 */
	href?: LinkOptions['href']
	/** What an `action` runs. */
	onSelect?: () => void
	/**
	 * Trailing affordance for an `action` — the raw SVG markup. An `external`
	 * link supplies its own, and a `route` link has none.
	 */
	glyph?: string
}

/**
 * One cell of the doormat's link grid.
 *
 * The three variants render different elements — a router link, an anchor to
 * somewhere else, a button — and are deliberately indistinguishable to look
 * at, so the grid reads as one list rather than as controls of three kinds.
 */
export const DoormatLink = component<DoormatLinkOptions>({
	name: 'doormat-link',
	styles,
	onMount({ append, element, create, options }) {
		const { label, variant, href: target, onSelect, glyph } = options

		if (variant === 'route' && target !== undefined) {
			return void append(
				create(Link, {
					href: target,
					classes: styles.link,
					children: label,
				})
			)
		}

		/** An external link always carries the ↗; an action may bring its own. */
		const affordance = variant === 'external'
			? trailingIcon
			: glyph

		/**
		 * The trailing glyph, as a sibling of the label text in normal flow
		 * rather than a flex item — that is what lets it hug the last word
		 * when a label wraps to two lines.
		 *
		 * `optional` evaluates its value eagerly and throws it away when the
		 * condition is false, so the source falls back to an empty string
		 * rather than being asserted non-null for a node nobody will see.
		 */
		const trailingMarker = optional(affordance !== undefined,
			element('span', {
				classes: styles.glyph,
				children: create(Icon, {
					source: affordance ?? '',
				}),
			})
		)

		if (variant === 'external' && target !== undefined) {
			return void append(
				create(Link, {
					href: target,
					classes: styles.link,
					target: '_blank',
					rel: 'noopener noreferrer',
					// The ↗ is decorative, so where the link goes has to be said
					// somewhere that is actually read out.
					aria: {
						label: localization.text`${label} (opens in a new tab)`
					},
					children: [
						label,
						trailingMarker,
					],
				})
			)
		}

		append(
			element('button', {
				type: 'button',
				classes: styles.link,
				on: {
					click() {
						onSelect?.()
					},
				},
				children: [
					label,
					trailingMarker
				],
			})
		)
	},
})
