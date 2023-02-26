import { defineConfig, getViteConfig } from 'astro/config';

// https://astro.build/config
import solidJs from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
    site: 'https://marvin-brouwer.github.io',
    base: '/five-dice',
    output: "static",
    integrations: [solidJs()],
    vite: getViteConfig({
        optimizeDeps: {
            exclude: ['astro']
        },
        build: {
            target: 'esnext'
        }
    })
});