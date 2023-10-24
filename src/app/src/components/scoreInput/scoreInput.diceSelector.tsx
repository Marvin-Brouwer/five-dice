import './scoreInput.diceSelector.css'

import type { ScoreInputState } from './scoreInput.state'
import type { Component } from 'solid-js'
import { Dialog } from '../hacks/dialog'
import { createSignal } from 'solid-js'
import { ScoreDialogPrompt } from './scoreInput.dialogPrompt'
import { ScoreInputButtons } from './scoreInput.scoreButtons'

type Props = {
    inputState: ScoreInputState
}

export const DiceSelector: Component<Props> = ({ inputState }) => {

	const [getCloseButtonRef, setCloseButtonRef] = createSignal<HTMLButtonElement | undefined>(undefined)
	const [getSubmitButtonRef, setSubmitButtonRef] = createSignal<HTMLButtonElement | undefined>(undefined)
	const [getFirstInputRef, setFirstInputRef] = createSignal<HTMLLabelElement | undefined>(undefined)

	return (
		<Dialog modal={true} dialogState={inputState.dialogs.diceSelector}>
            
			<section class="title-section">
				<h2>Please set your score</h2>
				<p>Configure the score of your current round</p>
			</section>
            
			<section class='dice-selector'>
				<ScoreInputButtons 
					inputState={inputState} scoreSet={inputState.diceSelector.getAllDiceSet} 
					getCloseButtonRef={getCloseButtonRef} getSubmitButtonRef={getSubmitButtonRef}
					setFirstDiceRef={setFirstInputRef} />
				<ScoreDialogPrompt 
					inputState={inputState} onSubmit={inputState.nextStep} submitEnabled={inputState.diceSelector.getAllDiceSet}
					submitLabel="select" submitDescription="Select the field to apply the current score to"
					setSubmitButtonRef={setSubmitButtonRef} setCloseButtonRef={setCloseButtonRef} 
					getFirstInputRef={getFirstInputRef} />
			</section>
		</Dialog>
	)
}