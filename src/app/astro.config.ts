import { defineConfig, getViteConfig } from 'astro/config';
import fs from 'fs';
import { build, Plugin, ResolvedConfig } from 'vite';
import type { PartialResolvedId } from 'rollup';

// https://astro.build/config
import solidJs from "@astrojs/solid-js";
import path from 'path';

/**
 * Normally you would never do this.
 * This just increases your bundle size.
 * However, GitHub pages doesn't allow for audio hosting
 */
const blobLoader = (extension: string, mimeType:string): Plugin => {
    
    const pluginName = 'vite-plugin-blob-loader';

    let _config : ResolvedConfig;

    return ({
        name: pluginName,
        enforce: 'post',
        apply: 'build',
        
        configResolved(resolvedConfig) {
            _config = resolvedConfig
        },
  
        load(id, options) {
            const [filePath, query] = id.split('?');
            // if (query !== 'blob')
                // return null;
            if (id.includes('horn'))
                console.log('fp', filePath)
            if (!filePath.endsWith(extension))
                return null;

            console.log('load', id, options)
            
        },
        
        resolveDynamicImport(specifier, importer, options) {
            const [filePath, query] = specifier.toString().split('?');
            if (query !== 'blob')
                return null;
            if (!filePath.endsWith(extension))
                return null;

            return {
                external: true,
                id: path.basename(specifier as string),
                resolvedBy: pluginName
            } as PartialResolvedId;
        },
       
        async transform(_, id) {
            const [filePath, query] = id.split('?');
            if (query !== 'blob')
                return null;
            if (!filePath.endsWith(extension))
                return null;


            const buffer = await fs.promises.readFile(filePath);
            const byteArray = new Uint8Array(buffer.byteLength);
            buffer.copy(byteArray);

            if (import.meta.env.DEV){
                const fileName = `${path.basename(filePath)}.js`;
            }
            console.log(_config)

            const name = path.parse(filePath).name;
            const hash = this.emitFile({
                type: 'asset',
                source: ''
            })
            const emitted = this.emitFile({
                fileName: `${hash}.js`,
                source: `
                    // ${hash}.js
                    const data = new Uint8Array([${byteArray}]);
                    const blobData = new Blob([data], { type: '${mimeType}' });
                    export default blobData
                `,
                type: 'asset'
            })

            console.log('n', name, 'e', emitted, 'h', hash)
            return {
                code: `
                    const AAAAA = "AAAA ${emitted}";
                    const blobData = await import("/${hash}.js?url");
                    export default new Blob([]);
                `};
        },
        
    });
};

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