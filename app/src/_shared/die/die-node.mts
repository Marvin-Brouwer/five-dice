import type { DieValue } from '../../game/logic/gameConstants.ts'
import type { RenderContext } from '../render-context.ts'

import { PipDie, type PipDieOptions } from './pip-die.mts'

export type DieNodeOptions = Omit<PipDieOptions, 'value'>

/**
 * One die face. Thin wrapper over `create(PipDie, …)` so the score card and
 * the dice keypad build dice the same way.
 */
export function dieNode(context: RenderContext, value: DieValue, options: DieNodeOptions = {}): Node {
	return context.create(PipDie, {
		value,
		ariaLabel: `${value}`,
		...options,
	})
}
