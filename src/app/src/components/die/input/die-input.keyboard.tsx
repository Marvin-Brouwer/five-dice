import "./die-input.keyboard.css"

import type { Accessor, Component, Setter, Signal } from 'solid-js';
import type { DieValue } from "../../../game/gameConstants";
import { DieRadioButton } from "./die-radio";
import { createSignal, createEffect, createMemo, createReaction } from 'solid-js';
import { createProxyForSignalAccessor, createSignalProxy } from '../../../helpers/signalHelpers';

type Props = {
    keyboardState: KeyboardState
}

export type KeyboardState = {
    accessor: Accessor<Keyboard>,
    valueSignal: Signal<DieValue | undefined>
    getName: Accessor<string>,
    autoFocusSignal: Signal<boolean>,
    getDialogState: Accessor<'open' | 'closing' | 'closed' | 'opening'>
}

export type Keyboard = {
    openKeyboard: (
        name: string, 
        valueSignal: Signal<DieValue | undefined>,
        autoFocusSignal: Signal<boolean>
    ) => void
    closeKeyboard: () => void
    keyboardOpen: (name?: string | undefined) => boolean
}

export function createKeyboardState(): KeyboardState {
    const [getTimeoutKey, setTimeoutKey] = createSignal<number | NodeJS.Timer>();
    const [getDialogState, setDialogState] = createSignal<'open' | 'closing' | 'closed' | 'opening'>('closed');
    const [getName, setName] = createSignal<string>('undefined');
    const [getValueSignal, setValueSignal] = createSignal<Signal<DieValue | undefined>>();
    const [getAutoFocusSignal, setAutoFocusSignal] = createSignal(createSignal(true));

    function openKeyboard(
        name: string, 
        valueSignal: Signal<DieValue | undefined>,
        autoFocusSignal: Signal<boolean>
    ) {
        if (getName() === name) return;
        if (getTimeoutKey() !== undefined) {
            clearTimeout(getTimeoutKey());
            setDialogState('open');
        }
        else if (getDialogState() !== 'opening' &&
            getDialogState() !== 'open')
        {
            setDialogState('opening');
            setTimeout(() => {
                setDialogState('open');
            }, 300)
        }

        setTimeoutKey(undefined);
        setName(name);
        setValueSignal(valueSignal);
        setAutoFocusSignal(autoFocusSignal);
    }
    function closeKeyboard() {
        setDialogState('closing');
        
        const timeoutKey = setTimeout(() => {
            if (getTimeoutKey() === undefined) return;
            if (getName() === 'undefined') return;
            if (getTimeoutKey() !== undefined) setTimeoutKey(undefined);

            setName('undefined');
            setDialogState('closed');
        }, 300)
        setTimeoutKey(timeoutKey);
        setValueSignal(undefined);
    } 

    const noopSignal: Signal<DieValue | undefined> = [
        (() => undefined) as Accessor<DieValue | undefined>, 
        (() => { }) as Setter<DieValue | undefined>
    ];
    return {
        accessor: createMemo(() => ({
            openKeyboard,
            closeKeyboard,
            keyboardOpen: (nameQuery?: string) => {
                if (getDialogState() !== 'open' && getDialogState() !== 'opening') return false;
                if (nameQuery === undefined) return true;
                return nameQuery === getName();
            }
        }), [getDialogState, getName]),
        valueSignal: createSignalProxy(
            () => (getValueSignal()?.[0]() ?? noopSignal[0]()),
            (v) => (getValueSignal()?.[1](v) ?? noopSignal[1](v))
        ),
        getName: () => getName(),
        autoFocusSignal: createProxyForSignalAccessor(getAutoFocusSignal),
        getDialogState
    }
}

export const DieInputKeyboard : Component<Props> = ({ keyboardState }) => {

    const value = keyboardState.valueSignal;
    const [getValue, setValue] = value;
    const name = keyboardState.getName();
    const { closeKeyboard, keyboardOpen } = keyboardState.accessor();
    const [getDialogReference, setDialogReference] = createSignal<HTMLDialogElement>()

    const initialValue = getValue();
    const [itemFocus, setItemFocus] = createSignal(getValue() as number ?? 1);

    createEffect(() => {
        if (!keyboardOpen()) return;
        setTimeout(() => {
            const input = getDialogReference()?.querySelector(`input[type="radio"][value="${getValue() ?? 1}"]`) as HTMLInputElement
            input?.focus();
            input?.select();
        });
    }, getValue)

    createEffect(() => {
        setItemFocus(getValue() ?? 0)
    }, getValue)

    const handleKeyEvent = (e: KeyboardEvent) => { 
        if (keyboardState.getDialogState() === 'closed') return false;
        if (keyboardState.getDialogState() === 'opening') return true;
        if (keyboardState.getDialogState() === 'closing') return true;

        const handled = () => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        if (e.key === "Escape") {
            keyboardState.autoFocusSignal[1](false);
            closeKeyboard();
            return handled();
        }

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

        const input = getDialogReference()?.querySelector(`input[type="radio"][value="${itemFocus() ?? 1}"]`) as HTMLInputElement
        input?.focus();
        input?.select();

        if (e.key === " ") {
            input?.click();
            setValue(Number(input?.value ?? 1) as DieValue);
            closeKeyboard();
            return handled();
        }
        if (e.key === "Enter"){ 
            setValue(Number(input?.value ?? 1) as DieValue);
            closeKeyboard();
            return handled();
        }

        return handled();
    };

    createEffect(() =>{
        if (keyboardState.getDialogState() === 'closed') {
            getDialogReference()?.close();
            return;
        }
        if (keyboardState.getDialogState() === 'closing') {
            getDialogReference()?.close();
            return;
        }
        if (getDialogReference()?.hasAttribute('open')) return;

        if (keyboardState.getDialogState() === 'opening') {
            getDialogReference()?.showModal();
            return;
        }
        if (keyboardState.getDialogState() === 'open') {
            getDialogReference()?.showModal();
            return;
        }
    }, keyboardState.getDialogState);

    return (
        <dialog class="die-input-keyboard" 
            onKeyDown={handleKeyEvent} ref={setDialogReference} role="toolbar"
            data-state={keyboardState.getDialogState()}
            onClose={() => false}
        >
            <div class="die-input-keyboard-grid">
                <DieRadioButton die='aces' value={value} group={`keyboard-${name}`} onClick={() => closeKeyboard()} />
                <DieRadioButton die='deuces' value={value} group={`keyboard-${name}`} onClick={() => closeKeyboard()} />
                <DieRadioButton die='threes' value={value} group={`keyboard-${name}`} onClick={() => closeKeyboard()} />
                <DieRadioButton die='fours' value={value} group={`keyboard-${name}`} onClick={() => closeKeyboard()} />
                <DieRadioButton die='fives' value={value} group={`keyboard-${name}`} onClick={() => closeKeyboard()} />
                <DieRadioButton die='sixes' value={value} group={`keyboard-${name}`} onClick={() => closeKeyboard()} />
            </div>
        </dialog>
    );
};
{/* <dialog id={id} ref={dialogReference!} 
    data-show-backdrop={showBackdrop?.() ?? true}
    aria-open={dialogState.isOpen()}
    onClose={() => {
        if (!dialogState.isOpen()) return;
        dialogState.closeDialog();
    }}
    class={className} aria-hidden={hide?.() ? true : false}>
    {modal && closeOnClick 
        ? <div class='click-backdrop' onClick={dialogClick} />
        : undefined
    }
    {unwrappedChildren()}
</dialog> */}