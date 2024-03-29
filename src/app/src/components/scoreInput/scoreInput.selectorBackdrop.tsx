import { Accessor, Component, createMemo } from 'solid-js'
import type { ScoreField } from '../../game/gameConstants'
import './scoreInput.selectorBackdrop.css'

type Props = {
	/** This is to help the svg id be unique */
	id: string
	validFields: Accessor<Array<ScoreField>>
	discardFields: Accessor<Array<ScoreField>>
	selectableRows: Accessor<Array<[element: HTMLTableRowElement, field: ScoreField]>>
}


export const SelectorBackdrop: Component<Props> = ({
	validFields, discardFields, id, selectableRows
}) => {

	const selectionWindows = createMemo(() =>
		selectableRows()
			.filter(([,field]) => validFields().includes(field) || discardFields().includes(field))
			.map(([item]) => {
				const bounds = item.getBoundingClientRect()

				return (
					<rect x={bounds.x} y={bounds.y} width={bounds.width + 1} height={bounds.height} fill='black' />
				)
			}),
	[selectableRows(), validFields(), discardFields()]
	)

	return (
		<section role="figure" class="selector-backdrop" aria-hidden={true}>
			<svg>
				<defs>
					<mask id={`available-inputs-${id}`} >
						<rect width="100%" height="100%" fill="white" />
						{selectionWindows()}
					</mask>
				</defs>
				<rect class="main-screen" mask={`url(#available-inputs-${id})`} />
			</svg>
		</section>
	)
}