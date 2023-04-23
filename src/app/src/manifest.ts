import type { ManifestOptions } from "vite-plugin-pwa";

export const manifest = (scope: string): Partial<ManifestOptions> => ({
	scope
});