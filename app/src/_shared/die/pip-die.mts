import { component } from '@rooted/components'
import type { Aria } from '@rooted/elements'

import { localization } from '../i18n/localization.mts'
import type { DieValue } from '../../game/logic/gameConstants.ts'

import styles from './pip-die.css'

/** Pip positions on a 3×3 grid (cells 0..8). */
const PIPS: Record<DieValue, number[]> = {
	1: [4],
	2: [0, 8],
	3: [0, 4, 8],
	4: [0, 2, 6, 8],
	5: [0, 2, 4, 6, 8],
	6: [0, 2, 3, 5, 6, 8],
}

/** Cell → viewBox coordinate on a 24-unit box (2.1r pips at margin ~4). */
const CELL_XY: Array<[number, number]> = [
	[ 6,  6], [12,  6], [18,  6],
	[ 6, 12], [12, 12], [18, 12],
	[ 6, 18], [12, 18], [18, 18],
]

export type PipDieOptions = {
	value: DieValue | undefined
	variant?: 'default' | 'active' | 'muted'
	aria?: Pick<Aria, 'label'>
}

export const PipDie = component<PipDieOptions>({
	name: 'pip-die',
	styles,
	onMount({ append, element, options }) {
		const { value, variant = 'default', aria } = options

		const pips = value === undefined ? [] : PIPS[value]
		// Dice faces are physically white in every theme, so pips and border
		// use --color-die-* (dark ink) rather than --color-text, otherwise the
		// menu / dice-keyboard's inverted palette would render invisible dots.
		const stroke = variant === 'active' ? 'var(--color-accent)' : 'var(--color-die-border)'
		const strokeWidth = variant === 'active' ? 2.5 : 1.5
		const strokeDash = value === undefined && variant !== 'active' ? '3 3' : undefined
		const pipColor = variant === 'muted' ? 'var(--color-text-muted)' : 'var(--color-die-dot)'
		const rectFill = variant === 'muted' ? 'transparent' : 'var(--color-die-face)'

		append(
			element('span', {
				classes: styles.die,
				role: 'img',
				aria: {
					label: renderAriaLabel(aria?.label, value)
				},
				children: element('svg', {
					viewBox: '0 0 24 24',
					aria: {
						hidden: 'true',
					},
					style: {
						display: 'block',
						width: '100%',
						height: '100%',
					},
					children: [
						element('svg:rect', {
							x: 1,
							y: 1,
							width: 22,
							height: 22,
							rx: 3,
							ry: 3,
							fill: rectFill,
							stroke,
							'stroke-width': strokeWidth,
							'stroke-dasharray': strokeDash,
						}),
						...pips.map((cell) => {
							const [cx, cy] = CELL_XY[cell]!
							return element('svg:circle', {
								cx,
								cy,
								r: 2.1,
								fill: pipColor,
							})
						}),
					],
				})
			})
		)
	},
})

function renderAriaLabel(ariaLabel: string | null | undefined, value: number | undefined): string | null | undefined {

	if (!!ariaLabel) return ariaLabel
	if (!value) return localization.text`Empty die`

	return localization.text`Die showing ${value}`
}
