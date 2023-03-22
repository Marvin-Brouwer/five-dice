/// <reference types="astro/client" />
// /// <reference types="vite-plugin-pwa/info.d.ts" />

// declare module 'virtual:pwa-register' {
// 	export * from 'vite-plugin-pwa/info.d.ts';
// 	export { registerSW } from 'vite-plugin-pwa/info.d.ts';
// };
// declare module 'virtual:pwa-info' {
// 	export * from 'vite-plugin-pwa/info.d.ts';
// 	export { pwaInfo } from 'vite-plugin-pwa/info.d.ts';
// };
declare module '*?blob' {
	function getBlobData(): Accessor<Blob.prototype>;
	export default getBlobData;
};
