import "./die-input.css"

import { Component, createMemo, JSX, Signal, createSignal, onMount, onCleanup, createEffect, createReaction, createComputed } from 'solid-js';
import type { DieValue } from '../../../game/gameConstants';
import { NumberDie } from "../number-die";
import { TextDie } from "../text-die";
import { Dialog } from "../../hacks/dialog";
import { DieInputKeyboard } from './die-input.keyboard';

type Props = JSX.HTMLAttributes<HTMLInputElement> 
& {
    name: string
    value: Signal<DieValue | undefined>,
}

export const DieInput : Component<Props> = ({ value, name, ...props }) => {

    let inputReference: HTMLInputElement;

    const [getValue, setValue] = value;
    const keyboardDialogState = createSignal(false);
    const [keyboardVisible, setKeyBoardVisible] = keyboardDialogState;

    const die = createMemo(() =>  {
        const dieValue = getValue();

        if (dieValue === undefined) return <TextDie value="" />;
        return <NumberDie amount={dieValue} />
    }
    , getValue);

    const handleInput = () => {        
        if (Number.isNaN(inputReference.valueAsNumber)) return false;
        if (inputReference.valueAsNumber <= 1 && inputReference.valueAsNumber >= 6) { 
            setValue(inputReference.valueAsNumber as DieValue); 
            setKeyBoardVisible(false);
            return true;
        }
        return false;
    }
    const handleKeyEvent = (e: KeyboardEvent) => { 
        const handled = () => {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            return false;
        };

        if (e.key === " ") {
            setKeyBoardVisible(true);
            return handled();
        }
        if (e.key === "Enter"){ 
            setKeyBoardVisible(true);
            return handled();
        }

        return true;
    };

    const handleInputEvent = (e: Event) => {
        const handled = () => {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();

            return false;
        }

        if (handleInput())
            return handled();

        return false;
    }

    const handleSelect = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        (e.currentTarget as HTMLInputElement).type = 'text';
        (e.currentTarget as HTMLInputElement).selectionStart = 0;
        (e.currentTarget as HTMLInputElement).selectionEnd = 0;
        (e.currentTarget as HTMLInputElement).setSelectionRange(0, 0, "none");
        (e.currentTarget as HTMLInputElement).type = 'number';
        setKeyBoardVisible(true);

        return false;
    }
    
    return (
        <span class="die-input" data-keyboard-visible={keyboardVisible()}>
            {die}
            <input type="number" value={getValue()} {...props}
                ref={inputReference!} 
                name={name}
                onInput={handleInputEvent} 
                onChange={handleInputEvent} 
                onSelect={handleSelect}
                onKeyDown={handleKeyEvent}
                onClick={() => setKeyBoardVisible(true)}
            />

            <DieInputKeyboard value={value} name={name} keyboardDialogState={keyboardDialogState} />
        </span>
    );
};