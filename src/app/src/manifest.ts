import type { ManifestOptions } from "vite-plugin-pwa";

export const manifest = (base: string): Partial<ManifestOptions> => ({
	scope: base,

	id: 'five-dice-scorecard',
	name: 'Five dice',
	short_name: '5-dice',

	theme_color: 'rgb(48, 48, 48)',
	background_color: 'rgb(244, 244, 244)',
	orientation: 'portrait',
	start_url: `/${base}/score-card`,

	icons: [
		{
			src: `./pwa/192x192.png`,
			sizes: '192x192',
			type: 'image/png',
			purpose: 'any'
		},
		{
			src: `./pwa/256x256.png`,
			sizes: '256x256',
			type: 'image/png',
			purpose: 'any'
		},
		{
			src: `./pwa/384x384.png`,
			sizes: '384x384',
			type: 'image/png',
			purpose: 'any'
		},
		{
			src: `./pwa/512x512.png`,
			sizes: '512x512',
			type: 'image/png',
			purpose: 'any'
		}
	]
});