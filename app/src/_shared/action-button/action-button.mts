import { component } from '@rooted/components'
import type { ElementOnHandlers } from '@rooted/events'
import { Link, type LinkOptions } from '@rooted/router'
import type { Store } from '@rooted/store'

import { Icon } from '../icon/icon.mts'

import chevronIcon from '../menu/menu-content.chevron.svg?raw'
import styles from './action-button.css'

export type ActionButtonVariant = 'primary' | 'secondary'

export type ActionButtonOptions = {
	label: string
	/** The line under the label — where the row leads, in a breath. */
	hint: string
	/**
	 * Optional store driving the hint reactively, for a row whose second line
	 * answers back — the share button's "Link copied". Overrides `hint`.
	 */
	hintStore?: Store<string>
	/** The badge glyph, as raw SVG markup. */
	glyph: string
	/**
	 * `primary` paints the whole row in accent, `secondary` leaves it on
	 * paper. A page with two rows uses one of each; a page with one uses
	 * `primary`. Defaults to `secondary`, the quieter of the two.
	 */
	variant?: ActionButtonVariant
	/**
	 * Where a navigating row points. Typed from the router's own option so a
	 * `href.for(...)` result passes straight through. With it the row is an
	 * anchor; without it, a button carrying `on`.
	 */
	href?: LinkOptions['href']
	/**
	 * Handlers for a row without an `href`, in `element()`'s own shape — so a
	 * caller writes `on: { click() { … } }` here exactly as it would on the
	 * button itself. Passed straight through, and contextually typed from the
	 * button's event map. A row with an `href` navigates instead and takes
	 * none of these.
	 */
	on?: ElementOnHandlers<HTMLButtonElement>
}

/**
 * A full-width call to action: badge, label and hint, chevron.
 *
 * The one row behind every "go here next" in the app — the two on the landing
 * page, the one closing the guide, the invite at the foot of every page — so
 * that they read as one kind of control rather than as four that happen to
 * agree. Callers wrap this rather than restyling it: see StartGameButton,
 * HowToButton and ShareButton, each of which is this with its own arguments.
 *
 * Renders an anchor or a button depending on whether it is given an `href`,
 * and the two are deliberately indistinguishable to look at — where the row
 * takes you is not the sort of difference the eye needs to resolve.
 *
 * Width is left to the caller: the row fills whatever measure it is given.
 */
export const ActionButton = component<ActionButtonOptions>({
	name: 'action-button',
	styles,
	onMount({ append, element, create, signal, options }) {
		const { label, hint, hintStore, glyph, variant = 'secondary', href, on } = options

		const hintLine = element('span', {
			classes: styles.hint,
			textContent: hintStore?.value ?? hint,
		})

		if (hintStore) {
			hintStore.on('change', signal, ({ detail }) => {
				hintLine.textContent = detail.state
			})
		}

		const classes = [
			styles.button,
			variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
		]

		const children = [
			element('span', {
				classes: styles.badge,
				children: create(Icon, {
					source: glyph,
				}),
			}),
			element('span', {
				classes: styles.text,
				children: [
					element('span', {
						classes: styles.title,
						textContent: label,
					}),
					hintLine,
				],
			}),
			element('span', {
				classes: styles.chevron,
				children: create(Icon, {
					source: chevronIcon,
				}),
			}),
		]

		if (href !== undefined) {
			return void append(
				create(Link, {
					href,
					classes,
					children,
				})
			)
		}

		append(
			element('button', {
				type: 'button',
				classes,
				on,
				children,
			})
		)
	},
})
