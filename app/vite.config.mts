import { rootedManifest } from '@rooted/application'
import { localizationSeo } from '@rooted/localization/vite'
import { rootedMarkdown } from '@rooted/markdown/vite'
import { generateRouteManifest } from '@rooted/router/manifest'
import { routeSeoPlugin } from '@rooted/seo/router'

import packageJson from './package.json' with { type: 'json' }
import { seo } from './src/seo.mts'

export default rootedManifest({
	seo,
	webManifest: {
		id: 'five-dice-scorecard',
		url: packageJson.homepage,
		name: 'Five dice',
		short_name: '5-dice',
		description: 'Grab five dice and see how far your luck stretches.',
		theme_color: '#000000',
		background_color: '#B3AEA1',
		display: 'minimal-ui',
		orientation: 'portrait'
	},
	plugins: [
		generateRouteManifest({
			glob: './src/**/_routes.mts',
			routeManifestPath: './src/_routes.g.mts',
		}),
		localizationSeo(),
		routeSeoPlugin(),
		rootedMarkdown(),
	],
})
