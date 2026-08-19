import { component } from '@rooted/components'

import styles from './icon.css'

export type IconOptions =
	| {
		/** Inline SVG markup (`import UndoIcon from './undo.svg?raw'`), inlined
		    via `innerHTML` so `stroke="currentColor"`/`fill="currentColor"`
		    icons follow the surrounding text color. */
		source: string
	}
	| {
		/** An image URL (`import UndoIcon from './undo.png?url'`), rendered
		    through an `<img>`. */
		url: URL,
		alt: string
	}

/** Renders an icon from either inline SVG markup or an image URL. */
export const Icon = component<IconOptions>({
	name: 'icon',
	styles,
	onMount({ append, element, options }) {
		append('source' in options
			? element('span', {
				classes: styles.icon,
				innerHTML: options.source,
			})
			: element('img', {
				classes: styles.icon,
				src: options.url.href,
				alt: options.alt,
			}))
	},
})
