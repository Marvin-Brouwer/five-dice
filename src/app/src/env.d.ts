/// <reference types="astro/client" />


declare module '*?blob' {
	export default Accessor<Blob.prototype>;
}