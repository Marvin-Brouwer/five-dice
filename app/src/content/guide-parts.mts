import { Markdown } from '@rooted/markdown'

import type { RenderContext } from '../_shared/render-context.ts'

import styles from './how-to-play.css'

/**
 * Render functions rather than components: every guide section declares
 * `how-to-play.css`, so they all share one CSS scope and these work inside any
 * of them. See `_shared/render-context.ts` for the distinction.
 */

/**
 * Prose from markdown, padded in from the card's ruled edge.
 *
 * `flush` drops the heading's top margin, for a section that butts straight up
 * against whatever precedes it rather than sitting on its own band.
 */
export function proseBlock(context: RenderContext, source: unknown, flush = false): Node {
	return context.element('div', {
		classes: [
			styles.guideProse,
			flush ? styles.guideProseFlush : undefined,
		],
		children: context.create(Markdown, {
			source: source as never,
		}),
	})
}

/**
 * A real piece of the app, shown rather than described. Illustrations only:
 * `inert` keeps their controls out of the tab order and aria-hidden keeps them
 * out of the accessibility tree, so the caption is what gets read.
 */
export function figure(context: RenderContext, caption: string, subject: Node): Node {
	const { element } = context
	return element('div', {
		classes: styles.guideFigures,
		children: element('figure', {
			classes: styles.guideFigure,
			children: [
				element('div', {
					classes: styles.guideFigureSubject,
					inert: true,
					aria: {
						hidden: 'true',
					},
					children: subject,
				}),
				element('figcaption', {
					classes: styles.guideFigureCaption,
					textContent: caption,
				}),
			],
		}),
	})
}
