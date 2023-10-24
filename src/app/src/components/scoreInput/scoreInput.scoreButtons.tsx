import './scoreInput.scoreButtons.css'

import { Accessor, Component, createReaction, Setter, onMount } from 'solid-js'
import type { ScoreInputState } from './scoreInput.state'
import { DieInput } from '../die/input/die-input'
import { createMemo } from 'solid-js'
import { createKeyboardState, DieInputKeyboard } from '../die/input/die-input.keyboard'

type Props = {
    inputState: ScoreInputState,
    scoreSet: Accessor<boolean>,
    getCloseButtonRef: Accessor<HTMLButtonElement | undefined>,
    getSubmitButtonRef: Accessor<HTMLButtonElement | undefined>,
    setFirstDiceRef: Setter<HTMLInputElement>,
}

export const ScoreInputButtons: Component<Props> = ({ 
	inputState, setFirstDiceRef, getSubmitButtonRef, scoreSet
}) => {

	const keyboardState = createKeyboardState()
    
	const fieldsDisabled = createMemo(() => ([
		() => false,
		() => inputState.diceSelector.getScoreForDie(0) === undefined,
		() => inputState.diceSelector.getScoreForDie(1) === undefined,
		() => inputState.diceSelector.getScoreForDie(2) === undefined,
		() => inputState.diceSelector.getScoreForDie(3) === undefined
	]), [inputState.diceSelector.getScore(), scoreSet()])

	const firstEmptyField = createMemo(() => inputState.diceSelector.getScore()
		.findIndex(value => value === undefined), inputState.diceSelector.getScore)

	const refs = new Array<HTMLInputElement|((el: HTMLInputElement) => void)>(5)

	const reaction = createReaction(() => {
		reaction(firstEmptyField)
		if (!inputState.dialogs.diceSelector.isOpen()) return
		requestAnimationFrame(setFocus)
	})

	onMount(() =>{
		reaction(inputState.dialogs.diceSelector.isOpen)
	})

	const setFocus = () =>{
		const field = firstEmptyField()
		if (field === -1) {
			getSubmitButtonRef()?.focus()
			return
		}

		const input = (refs[field] as HTMLInputElement)
		input.focus({ preventScroll: true })
		input.select()

		if (input !== document.activeElement)
			requestAnimationFrame(setFocus)
	}

	return <>
		<DieInputKeyboard 
			keyboardState={keyboardState} />
		<div class="score-input-buttons">
			<DieInput keyboard={keyboardState.accessor} ref={(el) => { setFirstDiceRef(el); refs[0] = el }} name='die-1' 
				disabled={fieldsDisabled()[0]} value={inputState.diceSelector.getSignalForDie(0)}
				autoFocus={inputState.autoFocus} />
			<DieInput keyboard={keyboardState.accessor} ref={refs[1]!} name='die-2' 
				disabled={fieldsDisabled()[1]} value={inputState.diceSelector.getSignalForDie(1)} 
				autoFocus={inputState.autoFocus}/>
			<DieInput keyboard={keyboardState.accessor} ref={refs[2]!} name='die-3' 
				disabled={fieldsDisabled()[2]} value={inputState.diceSelector.getSignalForDie(2)} 
				autoFocus={inputState.autoFocus}/>
			<DieInput keyboard={keyboardState.accessor} ref={refs[3]!} name='die-4' 
				disabled={fieldsDisabled()[3]} value={inputState.diceSelector.getSignalForDie(3)} 
				autoFocus={inputState.autoFocus}/>
			<DieInput keyboard={keyboardState.accessor} ref={refs[4]!} name='die-5' 
				disabled={fieldsDisabled()[4]} value={inputState.diceSelector.getSignalForDie(4)} 
				autoFocus={inputState.autoFocus}/>
		</div>
	</>
}
