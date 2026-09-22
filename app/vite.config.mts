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
		// The cardboard the app paints on (--color-page), so the startup image
		// an installed app is given hands over to the splash in index.html
		// without a step in the colour. The manifest is static, so it cannot
		// follow the dark theme — a dark-theme player still starts light.
		background_color: '#b8b2a6',
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
