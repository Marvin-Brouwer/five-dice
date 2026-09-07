import { route } from '@rooted/router/routes'

import { localization } from '../_shared/i18n/localization.mts'

export const ScoreCardRoute = route`/${localization.parameter}/score-card/`({
	async resolve({ create }) {
		await localization.load()
		const { Game } = await import('./game.mts')
		return create(Game)
	},
	seo: () => ({
		title: localization.text`Score card - Five dice`,
		description: localization.text`Play a game of five dice.`,
	}),
})
