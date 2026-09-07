/// <reference types="vite/client" />
/// <reference types="@rooted/markdown/vite/types" />

declare module '*.css' {
	const styles: import('@rooted/components').CssModule
	export default styles
}

declare module '*.svg?raw' {
	const content: string
	export default content
}

declare module '*.wav?blob' {
	const get: () => Blob
	export default get
}

declare module '*.mp3?blob' {
	const get: () => Blob
	export default get
}
