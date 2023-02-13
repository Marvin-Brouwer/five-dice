import './scoreInput.scoreButtons.css';

import type { Component } from "solid-js"
import type { ScoreInputState } from "./scoreInput.state"
import { DieInput } from '../die/input/die-input';
import { createSignal } from 'solid-js';
import type { DieValue } from '../../game/gameConstants';

type Props = {
    inputState: ScoreInputState
}

export const ScoreInputButtons: Component<Props> = () => {

    const value1 = createSignal<DieValue | undefined>(undefined)
    const value2 = createSignal<DieValue | undefined>(undefined)
    const value3 = createSignal<DieValue | undefined>(undefined)
    const value4 = createSignal<DieValue | undefined>(undefined)
    const value5 = createSignal<DieValue | undefined>(undefined)

    return <div class="score-input-buttons">
        <DieInput name='die-1' value={value1} />
        <DieInput name='die-2' value={value2} />
        <DieInput name='die-3' value={value3} />
        <DieInput name='die-4' value={value4} />
        <DieInput name='die-5' value={value5} />
    </div>
}
