import type { ScoreField } from '../../game/gameConstants'

type RowDisplayLabel = {
	title: string,
	scoreDescription: {
		short?: string,
		long: string
	}
}
export const rowDisplayLabels: Record<ScoreField, RowDisplayLabel> = {
	'aces': {
		title: 'Aces',
		scoreDescription: {
			long: 'Sum of aces'
		},
	},
	'deuces': {
		title: 'Deuces',
		scoreDescription: {
			long: 'Sum of deuces'
		},
	},
	'threes': {
		title: 'Threes',
		scoreDescription: {
			long: 'Sum of threes'
		},
	},
	'fours': {
		title: 'Fours',
		scoreDescription: {
			long: 'Sum of fours'
		},
	},
	'fives': {
		title: 'Fives',
		scoreDescription: {
			long: 'Sum of fives'
		},
	},
	'sixes': {
		title: 'Sixes',
		scoreDescription: {
			long: 'Sum of sixes'
		},
	},

	'threeOfKind' : {
		title: 'Three of a kind',
		scoreDescription: {
			short: 'Sum of dice',
			long: 'Total sum of the dice'
		},
	},
	'fourOfKind' : {
		title: 'Four of a kind',
		scoreDescription: {
			short: 'Sum of dice',
			long: 'Total sum of the dice'
		},
	},
	'fullHouse' : {
		title: 'Full house',
		scoreDescription: {
			long: '25 points'
		}
	},
	'smallStraight' : {
		title: 'Small straight',
		scoreDescription: {
			long: '30 points'
		}
	},
	'largeStraight' : {
		title: 'Large straight',
		scoreDescription: {
			long: '40 points'
		}
	},
	'flush' : {
		title: 'Flush',
		scoreDescription: {
			short: '50 points',
			long: '50 points, then 100 points each time'
		},
	},
	'chance' : {
		title: 'Chance',
		scoreDescription: {
			short: 'Sum of dice',
			long: 'Total sum of the dice'
		},
	}
}