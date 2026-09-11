import { route, wildcard } from '@rooted/router/routes'

import { localization } from '../_shared/i18n/localization.mts'

export const NotFoundLocalizedRoute = route`/${localization.parameter}/${wildcard()}/`({
	async resolve({ create, tokens }) {
		await localization.load()
		const { NotFoundLocalized } = await import('./not-found-localized.mts')
		return create(NotFoundLocalized, {
			locale: tokens.locale,
		})
	},
	seo: () => ({
		title: localization.text`Not found - Five dice`,
	}),
})
