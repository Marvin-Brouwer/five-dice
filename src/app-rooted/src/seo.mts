import type { SeoOptions } from '@rooted/application'

import packageJson from '../package.json' with { type: 'json' }

const baseUrl = packageJson.homepage.replace(/\/$/, '')

export const seo: SeoOptions = {
	llmsTxt: {
		intro: 'Five dice — a Yahtzee-style score-pad PWA built with the @rooted/* framework.',
		sections: [
			{
				title: 'Pages',
				entries: [
					{ title: 'Home', url: `${baseUrl}/`, description: 'Rules and how to play.' },
					{ title: 'Score card', url: `${baseUrl}/score-card/`, description: 'Play a round of five dice.' },
					{ title: 'Accessibility', url: `${baseUrl}/accessibility/`, description: 'Accessibility statement.' },
				],
			},
		],
	},
}
