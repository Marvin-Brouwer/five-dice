import "./scoreInput.css";

import type { Component } from "solid-js";
import { DieButton } from "../die/input/die-button";
import { createScoreInputState, ScoreInputStateProps } from "./scoreInput.state";
import { DiceSelector } from "./scoreInput.diceSelector";
import { RowSelector } from './scoreInput.rowSelector';
import { FlushDiscardSelector } from './scoreInput.flushDiscard';
import { roundAmount } from '../../game/gameConstants';
import { createSignal, createEffect } from 'solid-js';

type Props = ScoreInputStateProps

export const ScoreInputDialog: Component<Props> = (props) => {

    const inputState = createScoreInputState(props);
    const [getScorePad] = props.scorePad;
    const [getRound] = props.round;

    // Put into signal to force rerender on change
    const [getGameEnded, setGameEnded] = createSignal(getRound() > roundAmount);
    createEffect(() => {
        setGameEnded(getRound() > roundAmount);
        console.log(getGameEnded())
    }, getRound)

    if (getGameEnded()) return undefined;
    return (
        <section class="score-input">
            <div class="set-score">
                <DieButton 
                    value={<img src="/iconmonstr-plus-lined.svg" /> as Element} 
                    label="Enter a new round's value" disabled={inputState.isOpen} 
                    onClick={() => {
                        inputState.open();
                    }}
                />
            </div>
            <DiceSelector inputState={inputState} />
            <RowSelector inputState={inputState} getScorePad={getScorePad} />
            <FlushDiscardSelector inputState={inputState} getScorePad={getScorePad} />
        </section>
    );
}