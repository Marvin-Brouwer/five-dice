import { optional } from '@rooted/components'

import type { ScoreField } from '../logic/gameConstants.ts'
import { dice, type Dice } from '../logic/gameConstants.ts'
import { dieNode } from '../../_shared/die/die-node.mts'
import type { RenderContext } from '../../_shared/render-context.ts'

import { getRowDisplayLabels } from './score-card.labels.ts'
import styles from './score-table.css'

export type ScoreDescription = {
	short?: string
	long: string
}

/**
 * The rule description under a row title, or nothing when the row has none.
 *
 * When a short form exists both variants are rendered and CSS picks one, with
 * the long text on the parent's aria-label so screen readers always get it.
 */
function descriptionLabel(context: RenderContext, description?: ScoreDescription): Node | undefined {
	const { element } = context
	if (description === undefined) return undefined
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
			element('span', {
				classes: styles.descriptionShort,
				textContent: short,
			}),
			element('span', {
				classes: styles.descriptionLong,
				textContent: long,
			}),
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

	return element('span', {
		classes: styles.labelDisplay,
		children: [
			optional(icon !== undefined,
				element('span', {
					classes: styles.labelIcon,
					children: icon,
				})
			),
			element('span', {
				classes: styles.labelText,
				children: [
					element('span', {
						classes: styles.labelTitle,
						textContent: title,
					}),
					descriptionLabel(context, description),
				],
			}),
		],
	})
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
