import './scoreInput.diceButtons.css';

import type { Component } from 'solid-js';
import { DiceSelector } from './scoreInput.diceSelector';
import type { ScoreInputState } from './scoreInput.state';

type Props = {
    state: ScoreInputState
}
export const DiceButtons: Component<Props> = ({ state }) => {

    return (<>
        <div class="dice-buttons" data-score={state.score().join('-')}>
            <DiceSelector field={0} state={state} />
            <DiceSelector field={1} state={state} />
            <DiceSelector field={2} state={state} />
            <DiceSelector field={3} state={state} />
            <DiceSelector field={4} state={state} />
        </div></>
    )
}