import type { Component, Setter } from "solid-js";
import type { ScorePadModifier } from "../../game/score/useScorePad";
import { DieButton } from "../die/input/die-button";
import { DieInput } from "../die/input/die-input";
import { createSignal } from 'solid-js';
import type { DieValue } from "../../game/gameConstants";

type Props = {
    setRound: Setter<number>
    applyScore: ScorePadModifier
}

export const ScoreInputDialog: Component<Props> = () => {

    const dieValue = createSignal<DieValue | undefined>(undefined)

    return (
        <section class="score-input" style="font-size: 8ex">
            <DieButton value="+" onClick={() => console.log('click')}/>

            <DieInput value={dieValue} name="test" />
        </section>
    );
}