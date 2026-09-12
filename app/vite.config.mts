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
		theme_color: '#000000',
		background_color: '#B3AEA1',
		// Prefer the minimal-ui strip — it carries a back button, and Chrome
		// tints it with theme_color. A UA that does not support minimal-ui
		// falls back off `display` rather than off this list, and bare
		// `display: 'minimal-ui'` falls all the way back to 'browser' — no app
		// window at all. Naming standalone there keeps that floor sane.
		display_override: ['minimal-ui'],
		display: 'standalone',
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
