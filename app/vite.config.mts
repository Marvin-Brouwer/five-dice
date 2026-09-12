import { githubPagesAdapter } from '@rooted-adapters/github-pages'
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
		// Both mirror --color-page (index.tokens.css): the chrome and the splash
		// continue the cardboard the app bar sits on instead of cutting a black
		// bar across the top. theme-color.mts keeps the live chrome in step with
		// the chosen theme; this is what the installer bakes in.
		theme_color: '#b8b2a6',
		background_color: '#b8b2a6',
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
		githubPagesAdapter(),
	],
})
