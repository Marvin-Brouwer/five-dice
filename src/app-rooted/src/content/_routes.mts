import { route } from '@rooted/router/routes'

import { localization } from '../_shared/i18n/localization.mts'

export const HomeRoute = route`/${localization.parameter}/`({
	async resolve({ create }) {
		await localization.load()
		const { Home } = await import('./home.mts')
		return create(Home)
	},
	seo: () => ({
		// Brand name, deliberately not wrapped in localization.text
		title: 'Five dice',
		description: localization.text`A score pad for a game of five dice, playable anywhere.`,
	}),
})

export const HowToPlayRoute = route`/${localization.parameter}/how-to-play/`({
	async resolve({ create }) {
		await localization.load()
		const { HowToPlay } = await import('./how-to-play.mts')
		return create(HowToPlay)
	},
	seo: () => ({
		title: localization.text`How to play - Five dice`,
		description: localization.text`Rules and how to play Five dice.`,
	}),
})

export const AccessibilityRoute = route`/${localization.parameter}/accessibility/`({
	async resolve({ create }) {
		await localization.load()
		const { Accessibility } = await import('./accessibility.mts')
		return create(Accessibility)
	},
	seo: () => ({
		title: localization.text`Accessibility - Five dice`,
		description: localization.text`Accessibility statement for the Five dice app.`,
	}),
})
