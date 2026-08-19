import type { ComponentContext } from '@rooted/components'
import type { ReadonlyState } from '@rooted/store'

import type { DieValue, ScoreField } from '../_logic/gameConstants.ts'
import { isDiscarded, isFlushScore, type ValidScore } from '../_logic/score/score.ts'
import type { ScorePad } from '../_logic/score/scorePad.ts'
import { PipDie } from '../../_shared/die/pip-die.mts'

import { sortFullHouse, sortSimpleScore, sortSomeOfKind, sortStraight, type ScoreGroup } from './score-card.sorter.ts'
import styles from './score-card.css'

type RollContext = Pick<ComponentContext, 'element' | 'create'>

export function renderRollCell(
	context: RollContext,
	field: ScoreField,
	cell: ReadonlyState<ValidScore | ScorePad['flush']> | undefined,
): Node {
	const { element } = context

	if (cell === undefined) return element('span', { classes: styles.rollEmpty })
	// Discarded rows leave the roll & score cells empty; the big slash
	// across the row (drawn by CSS) is the sole discard indicator.
	if (isDiscarded(cell)) return element('span', { classes: styles.rollEmpty })

	if (isFlushScore(cell)) {
		if (field !== 'flush') return element('span')
		return renderFlush(context, cell)
	}

	const score = cell as ReadonlyState<ValidScore>
	const dice = Array.from(score) as DieValue[]

	switch (field) {
	case 'aces': return renderGrouped(context, sortSimpleScore(1, dice), true)
	case 'deuces': return renderGrouped(context, sortSimpleScore(2, dice), true)
	case 'threes': return renderGrouped(context, sortSimpleScore(3, dice), true)
	case 'fours': return renderGrouped(context, sortSimpleScore(4, dice), true)
	case 'fives': return renderGrouped(context, sortSimpleScore(5, dice), true)
	case 'sixes': return renderGrouped(context, sortSimpleScore(6, dice), true)

	case 'threeOfKind': return renderGrouped(context, sortSomeOfKind(3, dice), false)
	case 'fourOfKind': return renderGrouped(context, sortSomeOfKind(4, dice), false)
	case 'fullHouse': return renderGrouped(context, sortFullHouse(dice), false)
	case 'smallStraight': return renderGrouped(context, sortStraight(dice), false)
	case 'largeStraight': return renderGrouped(context, sortStraight(dice), false)
	case 'flush': return renderFlush(context, [score])
	case 'chance': return renderAll(context, dice)
	}
}

function renderGrouped(context: RollContext, groups: ScoreGroup, dimSmall: boolean): Node {
	const { element } = context
	const [small, large] = groups
	const wrap = element('span', { classes: styles.rollRow })
	if (small.length > 0) {
		wrap.append(element('span', {
			classes: [styles.rollGroup, dimSmall ? styles.rollGroupMuted : undefined],
			children: small.map(die => dieNode(context, die, dimSmall)),
		}))
	}
	if (large.length > 0) {
		wrap.append(element('span', {
			classes: styles.rollGroup,
			children: large.map(die => dieNode(context, die, false)),
		}))
	}
	return wrap
}

function renderFlush(context: RollContext, entries: ReadonlyState<Array<ValidScore>>): Node {
	const { element } = context
	if (entries.length === 0) return element('span', { classes: styles.rollEmpty })
	const latest = entries[entries.length - 1]!
	const dice = Array.from(latest) as DieValue[]
	const wrap = element('span', { classes: styles.rollRow })
	if (entries.length > 1) {
		wrap.append(element('span', {
			classes: styles.rollBadge,
			textContent: `+${entries.length - 1}`,
		}))
	}
	wrap.append(element('span', {
		classes: styles.rollGroup,
		children: dice.map(die => dieNode(context, die, false)),
	}))
	return wrap
}

function renderAll(context: RollContext, dice: DieValue[]): Node {
	const { element } = context
	return element('span', {
		classes: [styles.rollRow, styles.rollGroup],
		children: dice.map(die => dieNode(context, die, false)),
	})
}

function dieNode(context: RollContext, value: DieValue, muted: boolean): Node {
	return context.create(PipDie, {
		value,
		variant: muted ? 'muted' : 'default',
		ariaLabel: `${value}`,
	})
}
