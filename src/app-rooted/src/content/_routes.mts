import { route } from '@rooted/router/routes'

export const AccessibilityRoute = route`/accessibility/`({
	async resolve({ create }) {
		const { Accessibility } = await import('./accessibility.mts')
		return create(Accessibility)
	},
	seo: {
		title: 'Accessibility — Five dice',
		description: 'Accessibility statement for the Five dice app.',
	},
})
