import { localization } from '../../_shared/i18n/localization.mts'

import type { ScoreField } from '../_logic/gameConstants'

type RowDisplayLabel = {
	title: string,
	scoreDescription: {
		short?: string,
		long: string
	}
}

export const scoreFieldOrder: ScoreField[] = [
	'aces', 'deuces', 'threes', 'fours', 'fives', 'sixes',
	'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'flush', 'chance',
]

export function getRowDisplayLabels(): Record<ScoreField, RowDisplayLabel> {
	return {
		'aces': {
			title: localization.text`Aces`,
			scoreDescription: {
				long: localization.text`Sum of aces`
			},
		},
		'deuces': {
			title: localization.text`Deuces`,
			scoreDescription: {
				long: localization.text`Sum of deuces`
			},
		},
		'threes': {
			title: localization.text`Threes`,
			scoreDescription: {
				long: localization.text`Sum of threes`
			},
		},
		'fours': {
			title: localization.text`Fours`,
			scoreDescription: {
				long: localization.text`Sum of fours`
			},
		},
		'fives': {
			title: localization.text`Fives`,
			scoreDescription: {
				long: localization.text`Sum of fives`
			},
		},
		'sixes': {
			title: localization.text`Sixes`,
			scoreDescription: {
				long: localization.text`Sum of sixes`
			},
		},

		'threeOfKind' : {
			title: localization.text`Three of a kind`,
			scoreDescription: {
				short: localization.text`Sum of dice`,
				long: localization.text`Total sum of the dice`
			},
		},
		'fourOfKind' : {
			title: localization.text`Four of a kind`,
			scoreDescription: {
				short: localization.text`Sum of dice`,
				long: localization.text`Total sum of the dice`
			},
		},
		'fullHouse' : {
			title: localization.text`Full house`,
			scoreDescription: {
				long: localization.text`25 points`
			}
		},
		'smallStraight' : {
			title: localization.text`Small straight`,
			scoreDescription: {
				long: localization.text`30 points`
			}
		},
		'largeStraight' : {
			title: localization.text`Large straight`,
			scoreDescription: {
				long: localization.text`40 points`
			}
		},
		'flush' : {
			title: localization.text`Flush`,
			scoreDescription: {
				short: localization.text`50 points`,
				long: localization.text`50 points, then 100 points each time`
			},
		},
		'chance' : {
			title: localization.text`Chance`,
			scoreDescription: {
				short: localization.text`Sum of dice`,
				long: localization.text`Total sum of the dice`
			},
		}
	}
}
