/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*?blob' {
	function getBlobData(): Accessor<Blob.prototype>;
	export default getBlobData;
};
