import type { ScoreField } from '../_logic/gameConstants.ts'
import { dice, type Dice } from '../_logic/gameConstants.ts'
import { dieNode } from '../../_shared/die/die-node.mts'
import type { RenderContext } from '../../_shared/render-context.ts'

import { getRowDisplayLabels } from './score-card.labels.ts'
import styles from './score-table.css'

export type ScoreDescription = {
	short?: string
	long: string
}

/**
 * The rule description under a row title.
 *
 * When a short form exists both variants are rendered and CSS picks one, with
 * the long text on the parent's aria-label so screen readers always get it.
 */
export function descriptionLabel(context: RenderContext, description: ScoreDescription): Node {
	const { element } = context
	const { short, long } = description

	if (short === undefined) {
		return element('span', {
			classes: [styles.descriptionLabel, styles.simpleDescriptionLabel],
			textContent: long,
		})
	}

	return element('span', {
		classes: [styles.descriptionLabel, styles.responsiveDescriptionLabel],
		aria: { label: long },
		children: [
			element('span', { classes: styles.descriptionShort, textContent: short }),
			element('span', { classes: styles.descriptionLong, textContent: long }),
		],
	})
}

/** Title over description, optionally preceded by an icon. */
export function labelDisplay(
	context: RenderContext,
	title: string,
	description?: ScoreDescription,
	icon?: Node,
): Node {
	const { element } = context
	const children: Array<Node> = []

	if (icon !== undefined) {
		children.push(element('span', { classes: styles.labelIcon, children: icon }))
	}

	children.push(element('span', {
		classes: styles.labelText,
		children: [
			element('span', { classes: styles.labelTitle, textContent: title }),
			...(description === undefined ? [] : [descriptionLabel(context, description)]),
		],
	}))

	return element('span', { classes: styles.labelDisplay, children })
}

/** The `<th scope=row>` label cell of a score row. */
export function labelCell(context: RenderContext, field: ScoreField, withDieIcon: boolean): HTMLTableCellElement {
	const { element } = context
	const label = getRowDisplayLabels()[field]
	const icon = withDieIcon ? dieNode(context, dice[field as Dice]) : undefined

	return element('th', {
		scope: 'row',
		classes: styles.labelColumn,
		children: labelDisplay(context, label.title, label.scoreDescription, icon),
	})
}
