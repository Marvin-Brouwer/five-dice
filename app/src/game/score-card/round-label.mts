import { component } from '@rooted/components'

import { roundAmount } from '../logic/gameConstants.ts'
import type { ScorePadStore } from '../logic/scorePadStore.mts'
import { createAnnouncementStore, LiveRegion } from '../../_shared/a11y/live-region.mts'
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
		})

		// The party icon is decorative, so on its own the finished state is
		// silent -- an `aria-live` label with no text announces nothing. The
		// live region carries the wording instead.
		const announcement = createAnnouncementStore()
		function announce(text: string) {
			announcement.update(() => text)
		}

		function render() {
			const round = store.value.round
			if (round > roundAmount) {
				label.classList.add(styles.roundLabelFinished!)
				label.replaceChildren(create(Icon, {
					source: partyIcon,
				}))
				announce(localization.text`Game finished`)
				return
			}
			label.classList.remove(styles.roundLabelFinished!)
			label.replaceChildren(
				element('span', {
					classes: styles.roundHeading,
					textContent: localization.text`Round`,
				}),
				element('span', {
					classes: styles.roundLine,
					children: [
						element('span', {
							classes: styles.roundNumber,
							textContent: String(round),
						}),
						element('span', {
							classes: styles.roundOf,
							textContent: `/${roundAmount}`,
						}),
					],
				}),
			)
			announce('')
		}

		render()
		store.on('change', signal, render)

		replace(
			label,
			create(LiveRegion, {
				store: announcement,
			}),
		)
	},
})
