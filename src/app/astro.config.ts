import { defineConfig, getViteConfig } from 'astro/config';
import fs from 'fs';

// https://astro.build/config
import solidJs from "@astrojs/solid-js";

/**
 * Normally you would never do this.
 * This just increases your bundle size.
 * However, GitHub pages doesn't allow for audio hosting
 */
/** @type {import('vite').Plugin} */
const blobLoader = (extension: string, mimeType:string) => ({
    name: 'hex-loader',
    async transform(code: any, id: string) {
        const [filePath, query] = id.split('?');
        if (query !== 'blob') return null
        if (!filePath.endsWith(extension))
            return null;

        const buffer = await fs.promises.readFile(filePath);
        const byteArray = new Uint8Array(buffer.byteLength);
        buffer.copy(byteArray);

        return `
            const data = new Uint8Array([${byteArray}]);
            const blobData = new Blob([data], { type: '${mimeType}' });
            export default blobData
        `;
    }
});

// https://astro.build/config
export default defineConfig({
    site: 'https://marvin-brouwer.github.io',
    base: '/five-dice/',
    output: "static",
    integrations: [solidJs()],
    vite: {
        plugins: [blobLoader('.wav', 'audio/wav'), blobLoader('.mp3', 'audio/mp3')],
        optimizeDeps: {
            exclude: ['astro']
        },
        build: {
            target: 'esnext'
        }
    }
});