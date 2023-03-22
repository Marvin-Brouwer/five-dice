import { defineConfig } from 'astro/config';

// https://astro.build/config
import solidJs from "@astrojs/solid-js";
import { blobLoader } from './src/plugins/blobImport.plugin';
// import astroPwa from '@vite-pwa/astro';
// import { manifest } from './src/manifest';


// https://astro.build/config
export default defineConfig({
    site: 'https://marvin-brouwer.github.io',
    base: '/five-dice/',
    output: "static",
    integrations: [
		solidJs()
		// astroPwa()
	],
    vite: {
        plugins: [
			blobLoader('.wav'),
			blobLoader('.mp3')
		],
        optimizeDeps: {
            exclude: ['astro']
        },
        build: {
            target: 'esnext'
        }
    }
});