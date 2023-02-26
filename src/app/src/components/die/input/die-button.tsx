import "./die-button.css"
import type { Accessor, Component, JSX } from "solid-js";
import type { DieValue } from '../../../game/gameConstants';
import { createMemo, children } from 'solid-js';
import { TextDie } from '../text-die';
import { NumberDie } from "../number-die";

type Props = JSX.HTMLAttributes<HTMLButtonElement> 
& {
    value: Accessor<DieValue | undefined> | string | Element,
    label: Accessor<DieValue | undefined> | string,
    disabled?: Accessor<boolean>
    type?: 'button' | 'submit' | 'reset'
}

export const DieButton : Component<Props> = ({ value, label, disabled, type, ...props }) => {

    const die = createMemo(() =>  {
        if (value === undefined) return undefined;
        if (typeof value === typeof "string") return <TextDie value={value as string} label={label as string} />;
       
        if ((value as Element)?.tagName !== undefined || (value as any)['t'] !== undefined) {
            return <TextDie value={value as Element} label={label as string} />
        }

        const dieValue = (value as () => DieValue | undefined)();

        if (dieValue === undefined) return <TextDie value="" label="" />;
        return <NumberDie amount={dieValue} label={dieValue.toString()} />
    }
    , value)

    const disableClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    } 
    
    return (
        <button 
            class="die-button" type={type ?? 'button'} 
            disabled={disabled?.()}
            onClick={disabled?.() ? disableClick : undefined} {...props}>
            {die}
        </button>
    );
};