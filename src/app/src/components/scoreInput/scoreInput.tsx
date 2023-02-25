import "./scoreInput.css";

import type { Component, Signal } from "solid-js";
import { DieButton } from "../die/input/die-button";
import { createScoreInputState, ScoreInputStateProps } from "./scoreInput.state";
import { createMemo } from 'solid-js';
import { DiceSelector } from "./scoreInput.diceSelector";
import { RowSelector } from './scoreInput.rowSelector';
import { FlushDiscardSelector } from './scoreInput.flushDiscard';
import type { ScorePadAccessor } from "../../game/score/useScorePad";

type Props = ScoreInputStateProps

export const ScoreInputDialog: Component<Props> = (props) => {

    const inputState = createScoreInputState(props);
    const [getScorePad] = props.scorePad;

    return (
        <section class="score-input">
            <div class="set-score">
                <DieButton value="+" disabled={inputState.isOpen} onClick={() => {
                    inputState.open();
                }}/>
            </div>
            <DiceSelector inputState={inputState} />
            <RowSelector inputState={inputState} getScorePad={getScorePad} />
            <FlushDiscardSelector inputState={inputState} getScorePad={getScorePad} />
        </section>
    );
}