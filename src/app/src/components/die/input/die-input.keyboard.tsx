import "./die-input.keyboard.css"

import type { Component, Signal } from 'solid-js';
import type { DieValue } from "../../../game/gameConstants";
import { DieRadioButton } from "./die-radio";
import { createSignal, createEffect } from 'solid-js';
import { Dialog, DialogState } from '../../hacks/dialog';

type Props = {
    name: string
    value: Signal<DieValue | undefined>,
    keyboardDialogState: DialogState
}

export const DieInputKeyboard : Component<Props> = ({ value, name, keyboardDialogState }) => {

    const [getValue, setValue] = value;
    const initialValue = getValue();
    const { isOpen: dialogOpen, closeDialog }= keyboardDialogState;
    const [itemFocus, setItemFocus] = createSignal(getValue() as number ?? 1);

    let keyboardReference: HTMLSpanElement;

    createEffect(() => {
        if (!dialogOpen()) return;
        setTimeout(() => {
            const input = keyboardReference.querySelector(`input[type="radio"][value="${getValue() ?? 1}"]`) as HTMLInputElement
            input?.focus();
            input?.select();
        });
    }, getValue)

    createEffect(() => {
        setItemFocus(getValue() ?? 0)
        closeDialog();
    }, getValue)

    const handleKeyEvent = (e: KeyboardEvent) => { 
        if (e.key === "Escape") {
            setValue(initialValue);
            closeDialog();
            return true;
        }

        const handled = () => {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            return false;
        };

        if (e.shiftKey && (!Number.isInteger(e.key) && e.key !== "Tab"))  return true;
        if (e.key === "1") { setValue(1); setItemFocus(1); }
        if (e.key === "2") { setValue(2); setItemFocus(2); }
        if (e.key === "3") { setValue(3); setItemFocus(3); }
        if (e.key === "4") { setValue(4); setItemFocus(4); }
        if (e.key === "5") { setValue(5); setItemFocus(5); }
        if (e.key === "6") { setValue(6); setItemFocus(6); }

        if (itemFocus() === 0) setItemFocus(1);
        if (e.key === "ArrowLeft" || (e.shiftKey && e.key === "Tab")) {
            if (itemFocus() === 1) setItemFocus(6);
            else setItemFocus(itemFocus => itemFocus -1);
        }
        if (e.key === "ArrowRight" || e.key === "Tab") {
            if (itemFocus() === 6) setItemFocus(1);
            else setItemFocus(itemFocus => (itemFocus ?? 0) + 1);
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            if (itemFocus() <= 3) setItemFocus(itemFocus => itemFocus +3);
            else setItemFocus(itemFocus => itemFocus -3);
        }

        const input = keyboardReference.querySelector(`input[type="radio"][value="${itemFocus() ?? 1}"]`) as HTMLInputElement
        input?.focus();
        input?.select();

        if (e.key === " ") {
            input?.click();
            setValue(Number(input?.value ?? 1) as DieValue)
            closeDialog();
            return handled();
        }
        if (e.key === "Enter"){ 
            setValue(Number(input?.value ?? 1) as DieValue)
            closeDialog();
            return handled();
        }

        return handled();
    };

    return (
        <Dialog modal={true} dialogState={keyboardDialogState}>
            <span class="die-input-keyboard" onKeyDown={handleKeyEvent} ref={keyboardReference!} role="toolbar">
                <DieRadioButton die='aces' value={value} group={`keyboard-${name}`} />
                <DieRadioButton die='deuces' value={value} group={`keyboard-${name}`} />
                <DieRadioButton die='threes' value={value} group={`keyboard-${name}`} />
                <DieRadioButton die='fours' value={value} group={`keyboard-${name}`} />
                <DieRadioButton die='fives' value={value} group={`keyboard-${name}`} />
                <DieRadioButton die='sixes' value={value} group={`keyboard-${name}`} />
            </span>
        </Dialog>
    );
};