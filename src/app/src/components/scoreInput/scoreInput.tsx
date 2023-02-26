import "./scoreInput.css";

import type { Component } from "solid-js";
import { DieButton } from "../die/input/die-button";
import { createScoreInputState, ScoreInputStateProps } from "./scoreInput.state";
import { DiceSelector } from "./scoreInput.diceSelector";
import { RowSelector } from './scoreInput.rowSelector';
import { FlushDiscardSelector } from './scoreInput.flushDiscard';
import { roundAmount } from '../../game/gameConstants';
import { createMemo, onMount, createEffect } from 'solid-js';
import JSConfetti from 'js-confetti'

type Props = ScoreInputStateProps

export const ScoreInputDialog: Component<Props> = (props) => {

    const inputState = createScoreInputState(props);
    const [getScorePad] = props.scorePad;
    const [getRound] = props.round;

    // Put into memo to force rerender on change
    const gameEnded = createMemo(() => getRound() > roundAmount, getRound);

    onMount(() => {
        const confetti = new JSConfetti();
        createEffect(() => {
            if (gameEnded())
                confetti.addConfetti();
        }, gameEnded)
    })

    return (
        <section class="score-input">
            {gameEnded() ? undefined : 
                <>
                    <div class="set-score">
                        
                        <DieButton 
                            value={<img src="/iconmonstr-plus-lined.svg" /> as Element} 
                            description="Enter a new round's value" disabled={inputState.isOpen} 
                            onClick={() => {
                                inputState.open();
                            }}
                        />
                    </div>
                    <DiceSelector inputState={inputState} />
                    <RowSelector inputState={inputState} getScorePad={getScorePad} />
                    <FlushDiscardSelector inputState={inputState} getScorePad={getScorePad} />
                </>
            }
        </section>
    );
}