import { component } from '@rooted/components'

import type { DieValue } from '../../game/_logic/gameConstants.ts'
import { dieNode } from '../die/die-node.mts'

import styles from './dice-hero.css'

/** A roll that reads as one, rather than as a sorted set. Purely decorative. */
const heroRoll: DieValue[] = [5, 1, 3, 6, 2]

/**
 * The landing masthead: five dice tossed above the wordmark.
 *
 * The home page and the language picker hand straight over to each other, so
 * the mark has to look the same and land in the same place on both — hence one
 * component rather than a copy each. Set `--hero-measure` on an ancestor to
 * hold the dice to the page's column width.
 */
export const DiceHero = component({
	name: 'dice-hero',
	styles,
	onMount(context) {
		const { append, element } = context

		append(
			// Decoration only — the wordmark right below says the same thing in
			// words, so the dice stay out of the a11y tree.
			element('div', {
				classes: styles.dice,
				aria: {
					hidden: 'true'
				},
				// PipDie's own host is display:contents, so each die gets a slot
				// of its own to carry the tilt and the shadow.
				children: heroRoll.map(die => element('span', {
					classes: styles.dieSlot,
					children: dieNode(context, die),
				})),
			}),
			element('h1', {
				classes: styles.wordmark,
				// Brand name, deliberately not run through localization.
				textContent: 'Five dice',
			}),
		)
	},
})
