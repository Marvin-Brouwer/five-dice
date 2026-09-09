/// <reference types="vite/client" />
/// <reference types="@rooted/markdown/vite/types" />

declare module '*.css' {
	const styles: import('@rooted/components').CssModule
	export default styles
}
