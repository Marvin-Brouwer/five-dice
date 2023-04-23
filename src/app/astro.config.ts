import { defineConfig } from 'astro/config';
import { mkdir, rm } from 'fs/promises'

// https://astro.build/config
import solidJs from "@astrojs/solid-js";
import { blobLoader } from './src/plugins/blobImport.plugin';
import astroPwa from '@vite-pwa/astro';
import { manifest } from './src/manifest';

const tempWebworkerFolder = './dist/.dev-sw';
// Make sure the folder is empty to prevent build errors
await rm(tempWebworkerFolder, { recursive: true, force: true });

(process.env as any).SW_DEV = import.meta.env.SW_dev;

const base = '/five-dice/';
// https://astro.build/config
export default defineConfig({
    site: 'https://marvin-brouwer.github.io',
    base,
    output: "static",
    integrations: [
		solidJs(),
		astroPwa({
			base: import.meta.env.BASE_URL,
			mode: import.meta.env.PROD ? 'production' : 'development',
			registerType: 'autoUpdate',
			devOptions: {
				enabled: !import.meta.env.PROD,
				resolveTempFolder: async () => {

					// Make sure the dist folder exists for the webworker
					await mkdir(tempWebworkerFolder, { recursive: true });

					return tempWebworkerFolder;
				},
			},
			workbox: {
			  clientsClaim: true,
			  skipWaiting: import.meta.env.PROD,
			  mode: import.meta.env.PROD ? 'production' : 'development'
			},
			manifest: manifest(base)
		})
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