// SPIKE — Phase 0a POC, variant D.
// "Portal" row: the component host stays connected (so onMount runs and the
// signal stays alive) but renders its <tr> directly into a tbody passed in as
// an option. The host itself stays empty and lives outside the table, so the
// DOM is <tbody><tr>…</tr></tbody> — no wrapper in the containment chain.
import { component, cssClass, type ComponentContext } from '@rooted/components'
import type { ReadonlyState } from '@rooted/store'

import { type ScoreField } from '../game/_logic/gameConstants.ts'
import type { ScorePad } from '../game/_logic/score/scorePad.ts'

import { labelCellNode, rollCellNode, rowFacts, scoreCellNode } from './poc-row.mts'
import styles from '../game/score-card/score-card.css'

type RenderContext = Pick<ComponentContext, 'element' | 'create'>

export type PocPortalRowOptions = {
	field: ScoreField
	pad: ReadonlyState<ScorePad>
	/** Where the <tr> is actually rendered. */
	mount: HTMLElement
}

export const PocPortalRow = component<PocPortalRowOptions>({
	name: 'poc-portal-row',
	styles,
	onMount({ element, create, signal, options }) {
		const context: RenderContext = { element, create }
		const { field, pad, mount } = options
		const { cell, scoreText, discarded, applied } = rowFacts(pad, field)

		const row = element('tr', {
			classes: [
				styles.rowDisplay,
				cssClass(styles.discarded, discarded),
				cssClass(styles.rowApplied, applied),
			],
			children: [
				labelCellNode(context, field),
				rollCellNode(context, field, cell),
				scoreCellNode(context, scoreText, applied),
			],
		})
		row.dataset.field = field
		mount.append(row)
		// Lifetime is still the component's: when the host disconnects, take
		// the portalled node with it.
		signal.addEventListener('abort', () => row.remove(), { once: true })
	},
})
