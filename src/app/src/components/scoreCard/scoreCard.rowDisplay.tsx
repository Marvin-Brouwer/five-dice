import type { Component, JSX } from 'solid-js'
import type { ScoreField } from '../../game/gameConstants'
import type { ScorePadAccessor } from '../../game/score/useScorePad'
import { RollDisplay } from './scoreCard.rollDisplay'
import { ScoreDisplay } from './scoreCard.scoreDisplay'
import { LabelDisplay } from './scoreCard.labelDisplay'
import { createMemo } from 'solid-js'

type Props = {
    icon?: JSX.Element;
    field: ScoreField,
    scorePad: ScorePadAccessor
}

export const RowDisplay : Component<Props> = ({ icon, field, scorePad }) => {

	const score = createMemo(() => scorePad()[field], scorePad)
	return (
		<tr class="row-display" data-for-field={field}>
			<td class="label-column">
				<LabelDisplay icon={icon} field={field} />
			</td>
			<td class="roll-column">
				<RollDisplay field={field} score={score}/>
			</td>
			<td class="score-column">
				<ScoreDisplay field={field} scorePad={scorePad} />
			</td>
		</tr>
	)
}