import './scoreCard.labelDisplay.css'

import type { Component, JSX } from 'solid-js'
import type { ScoreField } from '../../game/gameConstants'
import { rowDisplayLabels } from './scoreCard.labelDisplay.labels'

type Props = {
    icon?: JSX.Element;
    field: ScoreField,
}
export const LabelDisplay: Component<Props> = ({ icon, field }) => {
    
	return (
		<span class="label-display">
			{icon}{rowDisplayLabels[field].title}
			<DescriptionLabel field={field} />
		</span>
	)
}

type DescriptionProps = {
    field: ScoreField
}
const DescriptionLabel: Component<DescriptionProps> = ({ field }) => {

	if (rowDisplayLabels[field].scoreDescription.short === undefined) return (
		<span class="description-label simple-description-label">
			{rowDisplayLabels[field].scoreDescription.long}
		</span>
	)

	const { short, long } = rowDisplayLabels[field].scoreDescription

	return (
		<span class="description-label responsive-description-label" aria-label={long}>
			<span class="short">{short}</span>
			<span class="long">{long}</span>
		</span>
	)
}