import './die-input.css'

import { Component, createMemo, JSX, Signal, Accessor, createEffect } from 'solid-js'
import type { DieValue } from '../../../game/gameConstants'
import { NumberDie } from '../number-die'
import { TextDie } from '../text-die'
import { useKeyboardContext } from '../../../context/keyboardContext'
import type { Keyboard } from './die-input.keyboard'

type Props = JSX.HTMLAttributes<HTMLInputElement>
& {
    name: string
    value: Signal<DieValue | undefined>,
    disabled?: Accessor<boolean>,
    autoFocus: Signal<boolean>,
    keyboard: Accessor<Keyboard>
}

export const DieInput : Component<Props> = ({ value, name, disabled, autoFocus, keyboard, ...props }) => {

	const inputReference = props.ref! as HTMLInputElement

	const keyboardContext = useKeyboardContext()
	const [getValue, setValue] = value
	const [getAutoFocus] = autoFocus
	const { closeKeyboard, openKeyboard, keyboardOpen } = keyboard()
	function showKeyboard() {
		openKeyboard(name, value, autoFocus)
	}

	const die = createMemo(() =>  {
		const dieValue = getValue()

		if (dieValue === undefined) return <TextDie value="" />
		return <NumberDie amount={dieValue} />
	}
	, getValue)

	const handleInput = () => {
		if (disabled?.()) return true
		if (inputReference.value === undefined || inputReference.value === '') return true
		if (Number.isNaN(inputReference.valueAsNumber)) return false
		if (inputReference.valueAsNumber <= 1 && inputReference.valueAsNumber >= 6) {
			setValue(inputReference.valueAsNumber as DieValue)
			closeKeyboard()
			return true
		}
		return false
	}

	createEffect(() => {
		if (!inputReference) return

		if (getValue() === undefined) inputReference.value = ''
		else inputReference.valueAsNumber = getValue()!

	}, getValue)

	const handleKeyEvent = (e: KeyboardEvent) => {
		const handled = () => {
			e.preventDefault()
			e.stopImmediatePropagation()
			e.stopPropagation()
			return false
		}
		if (disabled?.()) return true
		if (keyboardOpen()) return true

		if (e.shiftKey && (!Number.isInteger(e.key) && e.key !== 'Tab'))  return true
		if (e.key === '1') { setValue(1); return handled() }
		if (e.key === '2') { setValue(2); return handled() }
		if (e.key === '3') { setValue(3); return handled() }
		if (e.key === '4') { setValue(4); return handled() }
		if (e.key === '5') { setValue(5); return handled() }
		if (e.key === '6') { setValue(6); return handled() }

		if (e.key === ' ') {
			showKeyboard()
			return handled()
		}
		if (e.key === 'Enter'){
			showKeyboard()
			return handled()
		}

		return true
	}

	const handleClick = (e: MouseEvent) => {
		const handled = () => {
			e.preventDefault()
			e.stopImmediatePropagation()
			e.stopPropagation()

			return false
		}
		if (disabled?.()) return true

		showKeyboard()

		return handled()
	}

	const handleInputEvent = (e: Event) => {

		const handled = () => {
			e.preventDefault()
			e.stopImmediatePropagation()
			e.stopPropagation()

			return false
		}
		if (disabled?.()) return true

		if (handleInput())
			return handled()

		return false
	}

	const handleSelect = (e: Event) => {
		e.preventDefault()
		e.stopPropagation()
		e.stopImmediatePropagation();

		(e.currentTarget as HTMLInputElement).type = 'text';
		(e.currentTarget as HTMLInputElement).selectionStart = 0;
		(e.currentTarget as HTMLInputElement).selectionEnd = 0;
		(e.currentTarget as HTMLInputElement).setSelectionRange(0, 0, 'none');
		(e.currentTarget as HTMLInputElement).type = 'number'

		return false
	}

	const handleFocus = (e: Event) => {

		if (keyboardContext.isKeyboardUser()) return true
		if (keyboardOpen()) return true
		if (!getAutoFocus()) return true
		if (getValue() !== undefined) return true
		keyboardOpen()

		e.preventDefault()
		e.stopPropagation()
		e.stopImmediatePropagation()

		showKeyboard()

		return false
	}

	return (
		<span class="die-input" data-name={name}
			data-disabled={disabled?.()}
			data-keyboard-visible={keyboardOpen(name)}
		>
			{die()}
			<input type="number"
				inputmode="none"
				readOnly={true}
				value={getValue()} {...props}
				ref={inputReference!}
				name={name}
				disabled={disabled?.()}
				onInput={handleInputEvent}
				onChange={handleInputEvent}
				onSelect={handleSelect}
				onFocus={handleFocus}
				onKeyDown={handleKeyEvent}
				onClick={handleClick}
			/>
		</span>
	)
}