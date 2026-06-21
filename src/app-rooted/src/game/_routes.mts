import { route } from '@rooted/router/routes'

export const ScoreCardRoute = route`/score-card/`({
	async resolve({ create }) {
		const { Game } = await import('./game.mts')
		return create(Game)
	},
	seo: {
		title: 'Score card — Five dice',
		description: 'Play a game of five dice.',
	},
})
