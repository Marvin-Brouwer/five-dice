import { rootedManifest } from '@rooted/application'
import { localizationSeo } from '@rooted/localization/vite'
import { rootedMarkdown } from '@rooted/markdown/vite'
import { generateRouteManifest } from '@rooted/router/manifest'

import packageJson from './package.json' with { type: 'json' }
import { seo } from './src/seo.mts'

export default rootedManifest({
	seo,
	webManifest: {
		id: 'five-dice-scorecard',
		url: packageJson.homepage,
		name: 'Five dice',
		short_name: '5-dice',
		description: 'A Yahtzee-style score-pad PWA',
		theme_color: '#303030',
		background_color: '#f4f4f4',
		display: 'standalone',
		orientation: 'portrait',
		start_url: '/en/score-card/',
		icons: [
			{ src: 'pwa/192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: 'pwa/256x256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
			{ src: 'pwa/384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
			{ src: 'pwa/512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
		],
	},
	plugins: [
		generateRouteManifest({
			glob: './src/**/_routes.mts',
			routeManifestPath: './src/_routes.g.mts',
		}),
		localizationSeo(),
		rootedMarkdown(),
	],
})
