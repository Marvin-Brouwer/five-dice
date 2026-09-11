import type { ReadonlyState } from '@rooted/store'
import { cssClass } from '@rooted/components'

import type { DieValue, ScoreField } from '../logic/gameConstants.ts'
import { isDiscarded, isFlushScore, type ValidScore } from '../logic/score/score.ts'
import type { ScorePad } from '../logic/score/scorePad.ts'
import { dieNode } from '../../_shared/die/die-node.mts'
import type { RenderContext } from '../../_shared/render-context.ts'

import { sortFullHouse, sortSimpleScore, sortSomeOfKind, sortStraight, type ScoreGroup } from './score-card.sorter.ts'
import styles from './score-table.css'

export function renderRollCell(
	context: RenderContext,
	field: ScoreField,
	cell: ReadonlyState<ValidScore | ScorePad['flush']> | undefined,
): Node {
	const { element } = context

	if (cell === undefined) {
		return element('span', {
			classes: styles.rollEmpty,
		})
	}
	// Discarded rows leave the roll & score cells empty; the big slash
	// across the row (drawn by CSS) is the sole discard indicator.
	if (isDiscarded(cell)) {
		return element('span', {
			classes: styles.rollEmpty,
		})
	}

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

function renderGrouped(context: RenderContext, groups: ScoreGroup, dimSmall: boolean): Node {
	const { element } = context
	const [small, large] = groups
	const wrap = element('span', {
		classes: styles.rollRow,
	})
	if (small.length > 0) {
		wrap.append(
			element('span', {
				classes: [
					styles.rollGroup,
					cssClass(dimSmall, styles.rollGroupMuted),
				],
				children: small.map(die =>
					dieNode(context, die, {
						variant: dimSmall ? 'muted' : 'default',
					})
				),
			})
		)
	}
	if (large.length > 0) {
		wrap.append(
			element('span', {
				classes: styles.rollGroup,
				children: large.map(die =>
					dieNode(context, die)
				),
			})
		)
	}
	return wrap
}

function renderFlush(context: RenderContext, entries: ReadonlyState<Array<ValidScore>>): Node {
	const { element } = context
	if (entries.length === 0) {
		return element('span', {
			classes: styles.rollEmpty,
		})
	}
	const latest = entries[entries.length - 1]!
	const dice = Array.from(latest) as DieValue[]
	const wrap = element('span', {
		classes: styles.rollRow,
	})
	if (entries.length > 1) {
		wrap.append(
			element('span', {
				classes: styles.rollBadge,
				textContent: `+${entries.length - 1}`,
			})
		)
	}
	wrap.append(
		element('span', {
			classes: styles.rollGroup,
			children: dice.map(die =>
				dieNode(context, die)
			),
		})
	)
	return wrap
}

function renderAll(context: RenderContext, dice: DieValue[]): Node {
	const { element } = context
	return element('span', {
		classes: [
			styles.rollRow,
			styles.rollGroup,
		],
		children: dice.map(die =>
			dieNode(context, die)
		),
	})
}
