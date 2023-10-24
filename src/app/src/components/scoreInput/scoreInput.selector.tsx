import { Accessor, Component, Signal, createSignal, createMemo, createEffect } from 'solid-js'
import type { ScoreField } from '../../game/gameConstants'
import type { ScorePadAccessor } from '../../game/score/useScorePad'
import { SelectorBackdrop } from './scoreInput.selectorBackdrop'
import './scoreInput.selectorBackdrop.css'
import { SelectorButtons } from './scoreInput.selectorButtons'
import type { ScoreInputState } from './scoreInput.state'

type Props = {
	/** This is to help the svg id be unique */
	id: string
	validFields: Accessor<Array<ScoreField>>
	discardFields: Accessor<Array<ScoreField>>
	getScorePad: ScorePadAccessor
	inputState: ScoreInputState,
	selectedField: Signal<ScoreField | undefined>
	firstInputRef: Signal<HTMLLabelElement | undefined>
	previousButton: Accessor<HTMLButtonElement | undefined>
	nextButton: Accessor<HTMLButtonElement | undefined>
}


export const Selector: Component<Props> = ({
	validFields, discardFields, id, inputState, selectedField, getScorePad, previousButton, nextButton,
	firstInputRef
}) => {

	const [getElements, setElements] = createSignal<Array<HTMLTableRowElement>>([])
	createEffect(() => {
		setElements(Array.from(document.querySelectorAll<HTMLTableRowElement>('.row-display')))
	})
	const selectableRows = createMemo(() => {
		if (!inputState.diceSelector.getAllDiceSet()) return []
		return getElements()
			.filter(element => element !== undefined)
			.map<[element: HTMLTableRowElement, field: ScoreField]>(element => ([
				element,
					element.getAttribute('data-for-field') as ScoreField
			]))
	},
	[getElements(), inputState.diceSelector.getAllDiceSet()]
	)

	return (
		<div class="selector-frame">
			<SelectorBackdrop
				selectableRows={selectableRows}
				id={id} validFields={validFields} discardFields={discardFields} />
			<SelectorButtons
				selectableRows={selectableRows} getScorePad={getScorePad}
				validFields={validFields} discardFields={discardFields}
				inputState={inputState} selectedField={selectedField}
				previousButton={previousButton} nextButton={nextButton}
				firstInputRef={firstInputRef} />
		</div>
	)
}