import { defineConfig } from 'astro/config';

// https://astro.build/config
import solidJs from "@astrojs/solid-js";
import { blobLoader } from './src/plugins/blobImport.plugin';
import { pwa } from './src/plugins/astro.pwa.plugin';

const base = '/five-dice/';
// https://astro.build/config
export default defineConfig({
    site: 'https://marvin-brouwer.github.io',
    base,
    output: "static",
    integrations: [
		solidJs(),
		await pwa()
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