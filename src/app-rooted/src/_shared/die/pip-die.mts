import { component } from '@rooted/components'

import type { DieValue } from '../../game/_logic/gameConstants.ts'

import styles from './pip-die.css'

/** Pip positions on a 3×3 grid (cells 0..8). Matches shared.jsx PIPS. */
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
	size?: number
	variant?: 'default' | 'active' | 'muted'
	ariaLabel?: string
}

function svg(value: DieValue | undefined, variant: 'default' | 'active' | 'muted'): string {
	const pips = value === undefined ? [] : PIPS[value]
	const stroke = variant === 'active' ? 'var(--color-accent)' : 'var(--color-text)'
	const strokeWidth = variant === 'active' ? 2.5 : 1.5
	const strokeDash = value === undefined && variant !== 'active' ? '3 3' : ''
	const pipColor = variant === 'muted' ? 'var(--color-text-muted)' : 'var(--color-text)'
	const rectFill = variant === 'muted' ? 'transparent' : '#ffffff'
	return `
		<svg viewBox="0 0 24 24" aria-hidden="true" style="display:block;width:100%;height:100%">
			<rect x="1" y="1" width="22" height="22" rx="3" ry="3"
				fill="${rectFill}"
				stroke="${stroke}" stroke-width="${strokeWidth}"
				${strokeDash ? `stroke-dasharray="${strokeDash}"` : ''}/>
			${pips.map((cell) => {
				const [cx, cy] = CELL_XY[cell]!
				return `<circle cx="${cx}" cy="${cy}" r="2.1" fill="${pipColor}"/>`
			}).join('')}
		</svg>
	`
}

export const PipDie = component<PipDieOptions>({
	name: 'pip-die',
	styles,
	onMount({ append, element, options }) {
		const { value, size = 44, variant = 'default', ariaLabel } = options
		const wrap = element('span', {
			classes: styles.die,
			style: { width: `${size}px`, height: `${size}px` },
			role: 'img',
			aria: { label: ariaLabel ?? (value === undefined ? 'Empty die' : `Die showing ${value}`) },
		})
		wrap.innerHTML = svg(value, variant)
		append(wrap)
	},
})
