import packageJson from '../package.json' with { type: 'json' }

import type { SeoOptions } from '@rooted/seo'

const baseUrl = packageJson.homepage.slice(0, -1)

export const seo: SeoOptions = {
	llmsTxt: {
		// No headings in here: llms.txt reserves `##` sections for link lists.
		intro: [
			'Five dice is a free, open-source score card for the classic five-dice game.',
			'Players roll their own physical dice and enter the result. The app does not roll for them;',
			'it suggests which rows a roll fits, keeps the card and does all the adding up.',
			'',
			'The rules at a glance:',
			'',
			'- A game is 13 rounds. Each round allows up to 3 rolls: the first uses all five dice, after that any of them may be re-rolled.',
			'- Each round\'s dice are scored in one unused row. If nothing fits, a row can be discarded and is marked with a dash.',
			'- Upper section: Aces through Sixes, each scoring the sum of that face. A subtotal of 63 or more earns a 35 point bonus.',
			'- Lower section: Three of a kind and Four of a kind (sum of all dice), Full house (25), Small straight (30), Large straight (40), Flush (five of a kind) and Chance (sum of all dice).',
			'- The first Flush scores 50. Every further Flush scores 100, but also costs an unused row, which is discarded.',
			'- After the thirteenth round the card totals itself; the highest score wins.',
			'',
			'Using the app:',
			'',
			'- Every page exists in English (`/en/`) and Dutch (`/nl/`).',
			'- A game is played on the Score card page. How to play has the full rules, with worked examples.',
			'- A score card tracks one player, so in a group everyone keeps their own.',
			'- A game in progress is not saved. Reloading or leaving the page ends it, after a warning.',
			'',
		].join('\n'),
		sections: [
			{
				title: 'The game',
				entries: [
					{
						title: 'How to play', url: `${baseUrl}/en/how-to-play/`,
						description: 'Full rules, with worked examples of each score row.'
					},
					{
						title: 'Score card', url: `${baseUrl}/en/score-card/`,
						description: 'Start a game and keep score.'
					},
				],
			},
			{
				title: 'Other pages',
				entries: [
					{
						title: 'Accessibility', url: `${baseUrl}/en/accessibility/`,
						description: 'Accessibility statement.' },
					{
						title: 'Source code (Apache-2.0)', url: 'https://github.com/Marvin-Brouwer/five-dice',
						description: 'Application source code.'
					},
				],
			},
		]
	},
}
