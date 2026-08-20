import { component } from '@rooted/components'

import { roundAmount } from '../_logic/gameConstants.ts'
import type { ScorePadStore } from '../_logic/scorePadStore.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { Icon } from '../../_shared/icon/icon.mts'

import partyIcon from './score-card.party.svg?raw'
import styles from './round-label.css'

export type RoundLabelOptions = {
	store: ScorePadStore
}

/** "Round n / 13", swapping to a party icon once the game is over. */
export const RoundLabel = component<RoundLabelOptions>({
	name: 'round-label',
	styles,
	onMount({ replace, element, create, signal, options }) {
		const { store } = options

		const label = element('span', {
			classes: styles.roundLabel,
			aria: { live: 'polite' },
		})

		function render() {
			const round = store.value.round
			if (round > roundAmount) {
				label.classList.add(styles.roundLabelFinished!)
				label.setAttribute('aria-label', localization.text`Game finished`)
				label.replaceChildren(create(Icon, { source: partyIcon }))
				return
			}
			label.classList.remove(styles.roundLabelFinished!)
			label.removeAttribute('aria-label')
			label.replaceChildren(
				element('span', {
					classes: styles.roundHeading,
					textContent: localization.text`Round`,
				}),
				element('span', {
					classes: styles.roundLine,
					children: [
						element('span', { classes: styles.roundNumber, textContent: String(round) }),
						element('span', { classes: styles.roundOf, textContent: `/${roundAmount}` }),
					],
				}),
			)
		}

		render()
		store.on('change', signal, render)
		replace(label)
	},
})
