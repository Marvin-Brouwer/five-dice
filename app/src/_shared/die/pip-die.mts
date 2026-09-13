import { component } from '@rooted/components'
import type { Aria } from '@rooted/elements'

import { localization } from '../i18n/localization.mts'
import type { DieValue } from '../../game/logic/gameConstants.ts'

import { dieFrame, dieViewBox, pipCells, pipCoordinates, pipRadius } from './pip-geometry.ts'
import styles from './pip-die.css'

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

		const pips = value === undefined ? [] : pipCells[value]
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
					viewBox: dieViewBox,
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
							...dieFrame,
							fill: rectFill,
							stroke,
							'stroke-width': strokeWidth,
							'stroke-dasharray': strokeDash,
						}),
						...pips.map((cell) => {
							const [cx, cy] = pipCoordinates[cell]!
							return element('svg:circle', {
								cx,
								cy,
								r: pipRadius,
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
