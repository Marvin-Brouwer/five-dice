import './die-radio.css'

import type { Component, JSX, Signal } from 'solid-js'
import { dice, Dice, DieValue } from '../../../game/gameConstants'
import { createMemo } from 'solid-js'
import { NumberDie } from '../number-die'

type Props = JSX.HTMLAttributes<HTMLLabelElement> 
& {
    die: Dice
    group: string
    value: Signal<DieValue | undefined>,
    onClick: () => void
}

export const DieRadioButton : Component<Props> = ({ value, die, group, onClick, ...props }) => {

	const dieValue = dice[die]

	const [getValue, setValue] = value
	const checked = createMemo(() => getValue() === dieValue, getValue)
    
	return (
		<label class={`die-radio-button die-${die}`} data-checked={checked()} {...props}>
			<NumberDie amount={dieValue} />
			<input type="radio" name={group} value={dieValue} checked={checked()} 
				onClick={() => { setValue(dieValue); onClick() }}
			/>
		</label>
	)
}

