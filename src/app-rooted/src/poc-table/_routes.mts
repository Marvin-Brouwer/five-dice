// SPIKE — Phase 0a POC. Not for merge.
import { route } from '@rooted/router/routes'

export const PocTableRoute = route`/poc-table/`({
	async resolve({ create }) {
		const { PocTable } = await import('./poc-table.mts')
		return create(PocTable)
	},
	seo: {
		title: 'POC table — Five dice',
		description: 'Spike comparing table rows as free functions vs components.',
	},
})
