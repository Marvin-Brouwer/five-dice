import { component, cssClass } from '@rooted/components'

import type { DieValue } from '../../game/logic/gameConstants.ts'
import { dieNode } from '../die/die-node.mts'

import styles from './masthead.css'

/** A roll that reads as one, rather than as a sorted set. Purely decorative. */
const heroRoll: DieValue[] = [5, 1, 3, 6, 2]

/**
 * The dice settle once per document: a first visit, an F5, a link in from
 * somewhere else. The router rebuilds the page component on every navigation,
 * so without this the toss would replay each time you landed on a page
 * carrying the band. Module state, so a reload starts it over — and a
 * back/forward restore comes out of the bfcache with the DOM intact, so it
 * doesn't re-run there either.
 */
let hasSettled = false

/**
 * The letterhead every paper card wears: the wordmark, and five dice tossed
 * beside it, on the same black band the score card uses for its own header.
 *
 * It belongs to the paper rather than to the page, so it is handed to
 * PaperCard's `heading` slot and sits above the ruled frame — see
 * `_shared/paper-card/paper-card.mts`.
 */
export const Masthead = component({
	name: 'masthead',
	styles,
	onMount(context) {
		const { append, element } = context

		// Decoration only — the wordmark beside them says the same thing in
		// words, so the dice stay out of the a11y tree.
		const dice = element('div', {
			classes: [styles.dice, cssClass(!hasSettled, styles.settling)],
			aria: {
				hidden: 'true'
			},
			// PipDie's own host is display:contents, so each die gets a slot
			// of its own to carry the tilt.
			children: heroRoll.map(die => element('span', {
				classes: styles.dieSlot,
				children: dieNode(context, die),
			})),
		})
		hasSettled = true

		append(
			element('header', {
				classes: styles.masthead,
				children: [
					element('h1', {
						classes: styles.wordmark,
						// Brand name, deliberately not run through localization.
						textContent: 'Five dice',
					}),
					dice,
				],
			}),
		)
	},
})
