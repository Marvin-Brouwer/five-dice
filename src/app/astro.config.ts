import { defineConfig } from 'astro/config';

// https://astro.build/config
import solidJs from "@astrojs/solid-js";
import { blobLoader } from './src/plugins/blobImport.plugin';
import { pwa } from './src/plugins/astro.pwa.plugin';

const base = '/five-dice/';

// https://astro.build/config
export default defineConfig({
	// TEMP
    // site: import.meta.env.PROD ? 'https://marvin-brouwer.github.io' : undefined,
    base,
    output: "static",
    integrations: [
		solidJs(),
		await pwa(base)
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