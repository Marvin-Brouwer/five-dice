import "./die-button.css"
import type { Accessor, Component, JSX } from "solid-js";
import type { DieValue } from '../../../game/gameConstants';
import { createMemo } from 'solid-js';
import { TextDie } from '../text-die';
import { NumberDie } from "../number-die";

type Props = JSX.HTMLAttributes<HTMLButtonElement> 
& {
    value: Accessor<DieValue | undefined> | string,
}

export const DieButton : Component<Props> = ({ value, ...props }) => {

    const die = createMemo(() =>  {
        if (typeof value === typeof "string") return <TextDie value={value as string} />;

        const dieValue = (value as () => DieValue | undefined)();

        if (dieValue === undefined) return <TextDie value="" />;
        return <NumberDie amount={dieValue} />
    }
    , value)
    
    return (
        <button class="die-button" {...props}>
            {die}
        </button>
    );
};