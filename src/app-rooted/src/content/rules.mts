import { component } from '@rooted/components'
import { href, Link } from '@rooted/router'

import { ScoreCardRoute } from '../game/_routes.mts'
import { rowDisplayLabels } from '../game/score-card/score-card.labels.ts'
import { localization } from '../_shared/i18n/localization.mts'
import { routeTitleStore } from '../_shared/stores/routeTitleStore.mts'

import styles from './rules.css'

export const Rules = component({
	name: 'rules-page',
	styles,
	onMount({ append, element, create }) {
		routeTitleStore.update(() => 'Home')
		append(element('article', {
			classes: styles.page,
			children: [
				element('h1', { textContent: 'Five dice' }),

				element('h2', { textContent: 'About the game' }),
				element('p', {
					children: [
						'Five dice is a turn-based dice game that can be played anywhere. ',
						'The objective is to score the highest number of points possible by rolling certain combinations with the five dice. ',
						'It is typically played by multiple players but you ',
						element('em', { textContent: 'can' }),
						' play it by yourself.',
					],
				}),
				element('p', {
					children: create(Link, {
						href: href.for(ScoreCardRoute, { locale: localization.currentLocale }),
						classes: styles.cta,
						children: 'Start a new game',
					}),
				}),

				element('h2', { textContent: 'How to play' }),
				element('p', {
					textContent: 'The game consists of 13 rounds. Each round allows for up to 3 rolls. On the first roll you must roll all the dice; on rolls 2 and 3 you may choose which dice to re-roll. Re-rolling is optional — if you are happy with your score on an earlier roll, you may apply it immediately.',
				}),
				element('p', {
					textContent: 'After rolling, you choose a score row to apply the result to. The available rows are:',
				}),
				element('ul', {
					classes: styles.scoreOptions,
					children: Object.entries(rowDisplayLabels).map(([, label]) => element('li', {
						children: [
							element('strong', { textContent: label.title }),
							' — ',
							element('span', { textContent: label.scoreDescription.long }),
						],
					})),
				}),
				element('p', {
					textContent: 'If your dice do not match any unused row you can choose to discard a row — it will be marked as used with a dash where the score would have been.',
				}),

				element('h2', { textContent: 'Rolling a flush' }),
				element('p', {
					textContent: 'Whenever you roll five of the same dice you score a flush. The first flush is worth 50 points. Every subsequent flush is worth 100 points, but requires you to discard one unused row.',
				}),

				element('h2', { textContent: 'Undoing your last turn' }),
				element('p', {
					textContent: 'In case of a mistake you can undo your last committed round. You can only undo the most recent round.',
				}),

				element('h2', { textContent: 'Ending the game' }),
				element('p', {
					textContent: 'Once you have played the thirteenth round the game ends and the final score is calculated automatically. The winner is whoever has the highest final score.',
				}),
			],
		}))
	},
})
