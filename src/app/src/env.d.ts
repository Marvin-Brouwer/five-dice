/// <reference types="astro/client" />


declare module '*?blob' {
	function getBlobData(): Accessor<Blob.prototype>;
	export default getBlobData;
}