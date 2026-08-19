import { route } from '@rooted/router/routes'

import { localization } from '../_shared/i18n/localization.mts'

export const RulesRoute = route`/${localization.parameter}/`({
	async resolve({ create }) {
		await localization.load()
		const { Rules } = await import('./rules.mts')
		return create(Rules)
	},
	seo: () => ({
		// Brand name, deliberately not wrapped in localization.text
		title: 'Five dice',
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
