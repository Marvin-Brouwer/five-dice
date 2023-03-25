import { defineConfig } from 'astro/config';

// https://astro.build/config
import solidJs from "@astrojs/solid-js";
import { blobLoader } from './src/plugins/blobImport.plugin';
import astroPwa from '@vite-pwa/astro';
// import { manifest } from './src/manifest.ts.exclude';


// https://astro.build/config
export default defineConfig({
    site: 'https://marvin-brouwer.github.io',
    base: '/five-dice/',
    output: "static",
    integrations: [
		astroPwa({
			base: import.meta.env.BASE_URL,
			mode: import.meta.env.PROD ? 'production' : 'development',
			registerType: 'autoUpdate',
			devOptions: {
				enabled: !import.meta.env.PROD,
				resolveTempFolder: () => './dist/.dev-sw',
			}
		}),
		solidJs()
	],
    vite: {
        plugins: [
			blobLoader('.wav'),
			blobLoader('.mp3')
		],
        build: {
            target: 'esnext'
        }
    }
});