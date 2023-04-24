import astroPwa from '@vite-pwa/astro'
import { mkdir, rm } from 'fs/promises';
import { manifest } from '../manifest';
import path from 'path';

const tempWebworkerFolder = './dist/.dev-sw';

export async function pwa() {

	(process.env as any).SW_DEV = import.meta.env.SW_dev;

	// Make sure the folder is empty to prevent build errors
	await rm(tempWebworkerFolder, { recursive: true, force: true });

	const configuredPwa = astroPwa({
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
		  mode: import.meta.env.PROD ? 'production' : 'development',
		  navigateFallback: './404',
		  globPatterns: ['**/*.{css,js,html,svg,png,ico,txt}'],
		},
		manifest: manifest(import.meta.env.BASE_URL)
	})

	// Override id resolving to prevent the template parsing error
	// All of this is to prevent the service worker from trying to include:
	// ./src/app/src/layouts/footer.astro?astro&type=script&index=0&lang.ts
	// We're not sure why, or how this happened. Also, it's not reproducable for everyone.
	// However, this fixes the issue if you've encountered it.
	return {
		...configuredPwa,

		transform(code: string, id: string) {
			if (id.endsWith('.astro')) return;

			return (configuredPwa as any).transform(code, id);
		},
		entryFileNames({ name }: { name: string}) {
			let modifiedName = name;

			if(modifiedName.includes('?'))
				modifiedName = modifiedName.split('?')[0];

			return modifiedName;
		}
	}
}