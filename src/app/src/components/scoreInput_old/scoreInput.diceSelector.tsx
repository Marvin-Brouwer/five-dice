import './scoreInput.diceSelector.css';

import type { Component } from 'solid-js';
import { NumberDie } from '../die/number-die';
import { createMemo, createSignal, createEffect, createDeferred, createComputed, createRenderEffect } from 'solid-js';
import { TextDie } from '../die/text-die';
import { Dialog } from '../hacks/dialog';
import { Dice, dice } from '../../game/gameConstants';
import type { ScoreInput, ScoreInputState } from './scoreInput.state';

type Props = {
    field: keyof ScoreInput, 
    state: ScoreInputState
}

export const DiceSelector: Component<Props> = ({ 
    field, state
}) => {

    const value = createMemo(() => 
        state.getScoreForField(field),
        state.score
    );

    const selectedDie = createMemo(
        () => value() === undefined
            ? <TextDie value="" />
            : <NumberDie amount={value()!} />, 
        value
    )
    const hide = field === 0 ? () => false : createMemo(() => state.score()[field as number -1] === undefined, state.score);
    const dialogState = createSignal(state.isSelected(field));
    const [getDialogState,setDialogState] = dialogState;

    createEffect(() => { 
        setDialogState(state.isSelected(field)); 
        if(!state.isSelected(field) || state.getScoreForField(field) !== undefined) return;
        
        const dialog = document.getElementById(`dice-value-${field as string}`) as HTMLDialogElement;
        const input = dialog.querySelector(`input[value="${dice['aces']}"]`) as HTMLInputElement
        input?.focus();
        input?.select();

    }, [state.selectedField(), getDialogState()]);
    const tabGroup = 1 + (field as number * 6);
    const tabIndex = createMemo(() => 
        getDialogState() ? tabGroup : -1,
        getDialogState
    );

    return (
        <>
            <span class={`selector selector-${field as string}` }>
                <button 
                    type="button"
                    aria-hidden={hide()}
                    data-selected={state.isSelected(field)}
                    tabindex={tabIndex()}
                    onClick={() => state.selectField(field) }
                >
                    {selectedDie}
                </button>
            </span>
            <Dialog 
                id={`dice-value-${field as string}`} class="dice-value" 
                modal={false} dialogState={dialogState} hide={hide}
            >
                <DiceValueRadio die="aces" state={state} field={field} />
                <DiceValueRadio die="deuces" state={state} field={field} />
                <DiceValueRadio die="threes" state={state} field={field} />
                <DiceValueRadio die="fours" state={state} field={field} />
                <DiceValueRadio die="fives" state={state} field={field} />
                <DiceValueRadio die="sixes" state={state} field={field} />
            </Dialog>
        </>
    )
}

type DiceValueRadioProps = {
    die: Dice, 
    field: keyof ScoreInput,
    state: ScoreInputState
}

export const DiceValueRadio: Component<DiceValueRadioProps> = ({ 
    die, field, state
}) => {

    const value = dice[die];
    const checked = createMemo(
        () => state.getScoreForField(field) === value, 
        state.score
    );
    const tabGroup = 1 + (field as number * 6);

    const handleKeyEvent = (e: KeyboardEvent) => { 
        if (e.key === "Tab") return true;
        if (e.key === "Escape") return true;

        let itemFocus = dice[die]; 
        if (e.key === "ArrowLeft") {
            if (itemFocus === 1) itemFocus = 6;
            else itemFocus --;
        }
        if (e.key === "ArrowRight") {
            if (itemFocus === 6) itemFocus = 1;
            else itemFocus ++;
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            if (itemFocus <= 3) itemFocus += 3;
            else itemFocus -= 3;
        }

        const dialog = document.getElementById(`dice-value-${field as string}`) as HTMLDialogElement;
        const input = dialog.querySelector(`input[value="${itemFocus}"]`) as HTMLInputElement
        input?.focus();
        input?.select();

        if (e.key === " ") {
            input?.click();
        }
        if (e.key === "Enter" && state.getScoreForField(field) !== undefined){ 
            return true;
        }

        e.stopImmediatePropagation(); 
        e.stopPropagation();
        e.preventDefault();
        return false;
    };
    
    return (
        <label class={`dice die-${die}`} data-selected={checked()}>
            <NumberDie amount={value} />
            
            <input 
                tabIndex={1 + tabGroup} 
                type="radio" 
                autofocus={field === 0 && dice[die] as number === 0}
                name={`select-${field as string}`} 
                id={`dice-value-${field as string}-input-${die}`}
                value={dice[die]} 
                data-checked={checked()}
                checked={checked()} 
                onKeyDown={handleKeyEvent}
                onChange={(e) => {
                    if (!e.currentTarget.checked) return;
                    state.setScoreForField(field, value);
                    state.selectNextField();
                }}
                onClick={() => {
                    state.setScoreForField(field, value);
                    state.selectNextField();
                }}
            />
        </label>
    )
}